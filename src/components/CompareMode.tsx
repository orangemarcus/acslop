'use client';

import { useState } from 'react';
import { ComplexityLevel } from '@/types';
import { getSlopColor } from '@/lib/slopCalculator';

interface CompareModeProps {
  originalText: string;
  currentLevel: number;
  currentTranslated: string;
  currentScore: number;
}

interface CompareResult {
  translated: string;
  slopIndex: { score: number };
  coreClaim: string;
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'ELI5',
  2: 'Simple',
  3: 'Medium',
  4: 'Detailed',
  5: 'Expert',
};

export default function CompareMode({ originalText, currentLevel, currentTranslated, currentScore }: CompareModeProps) {
  const [compareLevel, setCompareLevel] = useState<ComplexityLevel | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runCompare = async (level: ComplexityLevel) => {
    if (level === currentLevel || loading) return;
    setCompareLevel(level);
    setLoading(true);
    setExpanded(true);
    setCompareResult(null);

    try {
      const res = await fetch('/api/translate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, level }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventLine = lines[lines.indexOf(line) - 1];
              if (eventLine?.startsWith('event: done')) {
                const data = JSON.parse(line.slice(6));
                setCompareResult({
                  translated: data.translated,
                  slopIndex: data.slopIndex,
                  coreClaim: data.coreClaim,
                });
              }
            } catch { /* skip partial */ }
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Compare Levels
        </h3>
        <svg className={`w-4 h-4 text-warm-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4">
          <p className="text-xs text-warm-500 dark:text-warm-400 mb-3">
            See how the translation changes at different complexity levels.
          </p>

          {/* Level buttons */}
          <div className="flex gap-1.5 mb-4">
            {([1, 2, 3, 4, 5] as ComplexityLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => runCompare(lvl)}
                disabled={lvl === currentLevel || loading}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  lvl === currentLevel
                    ? 'bg-terracotta-500 text-white cursor-default'
                    : compareLevel === lvl
                      ? 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400 border border-terracotta-300 dark:border-terracotta-700'
                      : 'bg-cream-100 dark:bg-warm-700 text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-600'
                }`}
              >
                {LEVEL_LABELS[lvl]}
                {lvl === currentLevel && ' (current)'}
              </button>
            ))}
          </div>

          {/* Comparison results */}
          {(loading || compareResult) && (
            <div className="grid grid-cols-2 gap-3">
              {/* Current */}
              <div className="rounded-xl border border-cream-200 dark:border-warm-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase text-warm-500 dark:text-warm-400">
                    Level {currentLevel} ({LEVEL_LABELS[currentLevel]})
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getSlopColor(currentScore) }}
                  >
                    {currentScore}
                  </span>
                </div>
                <p className="text-xs text-warm-700 dark:text-warm-300 leading-relaxed line-clamp-6">
                  {currentTranslated}
                </p>
              </div>

              {/* Compared */}
              <div className="rounded-xl border border-terracotta-200 dark:border-terracotta-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase text-terracotta-500 dark:text-terracotta-400">
                    Level {compareLevel} ({LEVEL_LABELS[compareLevel || 4]})
                  </span>
                  {compareResult && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: getSlopColor(compareResult.slopIndex.score) }}
                    >
                      {compareResult.slopIndex.score}
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-warm-500">Translating...</span>
                  </div>
                ) : compareResult ? (
                  <p className="text-xs text-warm-700 dark:text-warm-300 leading-relaxed line-clamp-6">
                    {compareResult.translated}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
