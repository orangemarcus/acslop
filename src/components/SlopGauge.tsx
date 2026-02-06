'use client';

import { useState, useEffect } from 'react';
import { SlopIndex } from '@/types';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';

interface SlopGaugeProps {
  slopIndex: SlopIndex;
}

const METRIC_TOOLTIPS: Record<string, string> = {
  'Passive Voice': 'Percentage of sentences using passive voice (e.g. "was observed" instead of "we observed")',
  'Nominalizations': 'Abstract nouns derived from verbs (e.g. "utilization" instead of "use")',
  'Hedge Words': 'Qualifiers that weaken claims (e.g. "somewhat", "arguably", "it could be said")',
  'Jargon Density': 'Technical or unnecessarily complex terms per sentence',
  'Avg Sentence Length': 'Average number of words per sentence (academic avg is 20-25)',
};

export default function SlopGauge({ slopIndex }: SlopGaugeProps) {
  const { score, breakdown } = slopIndex;
  const label = getSlopLabel(score);
  const color = getSlopColor(score);
  const [expanded, setExpanded] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Animate score number on mount
  useEffect(() => {
    setAnimatedScore(0);
    const duration = 700;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setAnimatedScore(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 36;
  const progress = (score / 100) * circumference;

  const metrics = [
    { label: 'Passive Voice', value: `${breakdown.passiveVoice}%`, raw: breakdown.passiveVoice, max: 100 },
    { label: 'Nominalizations', value: String(breakdown.nominalizations), raw: breakdown.nominalizations, max: 10 },
    { label: 'Hedge Words', value: String(breakdown.hedgeWords), raw: breakdown.hedgeWords, max: 5 },
    { label: 'Jargon Density', value: `${breakdown.jargonDensity}/sent`, raw: breakdown.jargonDensity, max: 5 },
    { label: 'Avg Sentence Length', value: `${breakdown.sentenceLength} words`, raw: Math.max(breakdown.sentenceLength - 10, 0), max: 30 },
  ];

  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
        aria-expanded={expanded}
      >
        <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200">Complexity Index</h3>
        <svg
          className={`w-4 h-4 text-warm-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Circular gauge - always visible */}
      <div className="flex justify-center my-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              className="stroke-cream-200 dark:stroke-warm-700"
              strokeWidth="6"
            />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-warm-900 dark:text-warm-100">{animatedScore}</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color, backgroundColor: `${color}15` }}>
          {label}
        </span>
      </div>

      {/* Collapsible breakdown */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-cream-200 dark:border-warm-700">
          {metrics.map((item) => {
            const pct = Math.min((item.raw / item.max) * 100, 100);
            return (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setHoveredMetric(item.label)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-warm-600 dark:text-warm-400 flex items-center gap-1 cursor-help">
                    {item.label}
                    <svg className="w-3 h-3 text-warm-400 dark:text-warm-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="font-medium text-warm-800 dark:text-warm-200">{item.value}</span>
                </div>
                <div className="h-1 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct > 70 ? '#ef4444' : pct > 40 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>

                {/* Tooltip */}
                {hoveredMetric === item.label && METRIC_TOOLTIPS[item.label] && (
                  <div className="absolute bottom-full left-0 mb-2 z-10 w-56 bg-warm-900 text-white text-xs rounded-lg shadow-lg p-2.5 pointer-events-none">
                    {METRIC_TOOLTIPS[item.label]}
                    <div className="absolute top-full left-4 w-2 h-2 bg-warm-900 rotate-45 -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
