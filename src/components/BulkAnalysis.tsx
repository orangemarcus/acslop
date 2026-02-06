'use client';

import { useState, useRef, useCallback } from 'react';
import { TranslateResponse, ComplexityLevel } from '@/types';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';

interface Section {
  title: string;
  text: string;
}

interface SectionResult {
  section: Section;
  result: TranslateResponse | null;
  status: 'pending' | 'translating' | 'done' | 'error';
  error?: string;
}

interface BulkAnalysisProps {
  level: ComplexityLevel;
  onClose: () => void;
}

function splitIntoSections(text: string): Section[] {
  const sections: Section[] = [];

  // Try to split by common academic headings
  const headingRegex = /^(?:\d+\.?\s*)?(?:Abstract|Introduction|Background|Methods?|Methodology|Results?|Discussion|Conclusion|References|Acknowledgements?|Related Work|Literature Review|Data|Analysis|Findings|Limitations|Future Work|Appendix)/im;

  const lines = text.split('\n');
  let currentTitle = 'Section 1';
  let currentLines: string[] = [];
  let sectionCount = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && headingRegex.test(trimmed) && currentLines.join('\n').trim().length > 0) {
      sections.push({
        title: currentTitle,
        text: currentLines.join('\n').trim(),
      });
      currentTitle = trimmed;
      currentLines = [];
      sectionCount++;
    } else {
      currentLines.push(line);
    }
  }

  // Push remaining content
  if (currentLines.join('\n').trim().length > 0) {
    sections.push({
      title: currentTitle,
      text: currentLines.join('\n').trim(),
    });
  }

  // If no headings found, split by paragraphs (double newline)
  if (sections.length <= 1) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);

    if (paragraphs.length > 1) {
      return paragraphs.map((p, i) => ({
        title: `Paragraph ${i + 1}`,
        text: p.trim(),
      }));
    }

    // If still just one block, split by ~500 words
    if (sections.length === 0 || text.split(/\s+/).length > 500) {
      const words = text.split(/\s+/);
      const chunks: Section[] = [];
      const chunkSize = 400;

      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push({
          title: `Part ${chunks.length + 1}`,
          text: words.slice(i, i + chunkSize).join(' '),
        });
      }
      return chunks.length > 0 ? chunks : sections;
    }
  }

  return sections;
}

function parseSSE(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = chunk.split('\n\n').filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n');
    let event = '';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data = line.slice(6);
    }
    if (event && data) events.push({ event, data });
  }
  return events;
}

export default function BulkAnalysis({ level, onClose }: BulkAnalysisProps) {
  const [inputText, setInputText] = useState('');
  const [sections, setSections] = useState<SectionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSplit = () => {
    if (!inputText.trim()) return;
    const parts = splitIntoSections(inputText.trim());
    setSections(parts.map((s) => ({ section: s, result: null, status: 'pending' })));
  };

  const translateSection = useCallback(
    async (text: string, sectionLevel: ComplexityLevel, signal: AbortSignal): Promise<TranslateResponse> => {
      const response = await fetch('/api/translate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, level: sectionLevel }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Translation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lastDoubleNewline = buffer.lastIndexOf('\n\n');
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSE(complete);
        for (const evt of events) {
          const data = JSON.parse(evt.data);
          if (evt.event === 'done') return data as TranslateResponse;
          if (evt.event === 'error') throw new Error(data.error || 'Translation failed');
        }
      }

      if (buffer.trim()) {
        const events = parseSSE(buffer);
        for (const evt of events) {
          const data = JSON.parse(evt.data);
          if (evt.event === 'done') return data as TranslateResponse;
          if (evt.event === 'error') throw new Error(data.error || 'Translation failed');
        }
      }

      throw new Error('Stream ended without result');
    },
    []
  );

  const handleRun = async () => {
    if (sections.length === 0) return;
    setIsRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    for (let i = 0; i < sections.length; i++) {
      if (controller.signal.aborted) break;
      setCurrentIndex(i);

      setSections((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'translating' };
        return updated;
      });

      try {
        const result = await translateSection(sections[i].section.text, level, controller.signal);
        setSections((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], result, status: 'done' };
          return updated;
        });
      } catch (err) {
        if (controller.signal.aborted) break;
        setSections((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed',
          };
          return updated;
        });
      }

      // Small delay between requests
      if (i < sections.length - 1 && !controller.signal.aborted) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    abortRef.current = null;
  };

  const handleCancel = () => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(false);
    setCurrentIndex(-1);
  };

  const completedSections = sections.filter((s) => s.status === 'done');
  const avgScore =
    completedSections.length > 0
      ? Math.round(
          completedSections.reduce((sum, s) => sum + (s.result?.slopIndex.score || 0), 0) /
            completedSections.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-warm-900 dark:text-warm-100">Bulk Paper Analysis</h2>
          <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
            Paste a full paper to analyze each section individually
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </div>

      {/* Input area */}
      {sections.length === 0 && (
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste the full paper text here. The tool will automatically detect sections (Abstract, Introduction, Methods, Results, etc.) or split by paragraphs..."
            className="w-full h-48 px-4 py-3 bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-xl text-sm text-warm-800 dark:text-warm-200 placeholder-warm-400 dark:placeholder-warm-500 resize-y focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-warm-400 dark:text-warm-500">
              {inputText.length > 0
                ? `${inputText.split(/\s+/).filter(Boolean).length} words`
                : 'Paste your paper text above'}
            </span>
            <button
              onClick={handleSplit}
              disabled={!inputText.trim()}
              className="px-5 py-2 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:bg-cream-300 dark:disabled:bg-warm-700 disabled:text-cream-400 dark:disabled:text-warm-500 disabled:cursor-not-allowed text-sm"
            >
              Split into Sections
            </button>
          </div>
        </div>
      )}

      {/* Sections list */}
      {sections.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-warm-800 dark:text-warm-200">
                {isRunning
                  ? `Analyzing section ${currentIndex + 1} of ${sections.length}...`
                  : completedSections.length === sections.length
                  ? 'Analysis complete!'
                  : `${sections.length} sections detected`}
              </span>
              <div className="flex items-center gap-3">
                {completedSections.length > 0 && (
                  <span className="text-sm font-bold" style={{ color: getSlopColor(avgScore) }}>
                    Avg: {avgScore}/100
                  </span>
                )}
                {isRunning ? (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Cancel
                  </button>
                ) : completedSections.length < sections.length ? (
                  <button
                    onClick={handleRun}
                    className="px-4 py-1.5 text-xs font-medium bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600"
                  >
                    Analyze All
                  </button>
                ) : null}
              </div>
            </div>
            <div className="h-2 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Section cards */}
          <div className="space-y-3">
            {sections.map((s, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-warm-800 rounded-2xl border shadow-soft overflow-hidden transition-all ${
                  s.status === 'translating'
                    ? 'border-terracotta-400 dark:border-terracotta-600'
                    : 'border-cream-300 dark:border-warm-700'
                }`}
              >
                {/* Section header */}
                <button
                  onClick={() => setExpandedSection(expandedSection === i ? null : i)}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-cream-50 dark:hover:bg-warm-750 transition-colors"
                >
                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {s.status === 'pending' && (
                      <div className="w-8 h-8 rounded-lg bg-cream-200 dark:bg-warm-700 flex items-center justify-center text-xs font-bold text-warm-400">
                        {i + 1}
                      </div>
                    )}
                    {s.status === 'translating' && (
                      <div className="w-8 h-8 rounded-lg bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {s.status === 'done' && s.result && (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: getSlopColor(s.result.slopIndex.score) }}
                      >
                        {s.result.slopIndex.score}
                      </div>
                    )}
                    {s.status === 'error' && (
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title and preview */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">
                      {s.section.title}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 truncate mt-0.5">
                      {s.section.text.slice(0, 100)}...
                    </p>
                  </div>

                  {/* Score label */}
                  {s.status === 'done' && s.result && (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: getSlopColor(s.result.slopIndex.score) + '20',
                        color: getSlopColor(s.result.slopIndex.score),
                      }}
                    >
                      {getSlopLabel(s.result.slopIndex.score)}
                    </span>
                  )}

                  {/* Expand icon */}
                  <svg
                    className={`w-4 h-4 text-warm-400 transition-transform flex-shrink-0 ${
                      expandedSection === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {expandedSection === i && s.status === 'done' && s.result && (
                  <div className="px-5 pb-5 border-t border-cream-200 dark:border-warm-700 pt-4 space-y-4">
                    {/* Core claim */}
                    <div>
                      <h4 className="text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">Core Claim</h4>
                      <p className="text-sm text-warm-800 dark:text-warm-200">{s.result.coreClaim}</p>
                    </div>

                    {/* Original vs translated */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">Original</h4>
                        <p className="text-xs text-warm-600 dark:text-warm-300 leading-relaxed font-serif italic">
                          {s.result.original.slice(0, 300)}{s.result.original.length > 300 ? '...' : ''}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">Plain English</h4>
                        <p className="text-xs text-warm-600 dark:text-warm-300 leading-relaxed">
                          {s.result.translated}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown mini */}
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'Passive Voice', value: `${s.result.slopIndex.breakdown.passiveVoice}%` },
                        { label: 'Nominalizations', value: s.result.slopIndex.breakdown.nominalizations },
                        { label: 'Hedge Words', value: s.result.slopIndex.breakdown.hedgeWords },
                        { label: 'Jargon/Sent', value: s.result.slopIndex.breakdown.jargonDensity },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center">
                          <p className="text-xs font-bold text-warm-800 dark:text-warm-200">{stat.value}</p>
                          <p className="text-[10px] text-warm-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Hallucinations */}
                    {s.result.hallucinations.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                          {s.result.hallucinations.length} hallucination flag{s.result.hallucinations.length > 1 ? 's' : ''}
                        </p>
                        {s.result.hallucinations.map((h, hi) => (
                          <p key={hi} className="text-xs text-red-600 dark:text-red-400">
                            [{h.severity}] {h.text}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Error message */}
                {expandedSection === i && s.status === 'error' && (
                  <div className="px-5 pb-4 border-t border-cream-200 dark:border-warm-700 pt-3">
                    <p className="text-xs text-red-600 dark:text-red-400">{s.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary card after completion */}
          {completedSections.length === sections.length && sections.length > 0 && (
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft text-center">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3"
                style={{ backgroundColor: getSlopColor(avgScore) }}
              >
                {avgScore}
              </div>
              <p className="text-lg font-serif text-warm-900 dark:text-warm-100">
                Overall: {getSlopLabel(avgScore)}
              </p>
              <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
                Average slop score across {sections.length} section{sections.length > 1 ? 's' : ''}
              </p>
              <button
                onClick={() => {
                  setSections([]);
                  setInputText('');
                }}
                className="mt-4 text-sm text-terracotta-500 hover:text-terracotta-600 font-medium"
              >
                Analyze another paper
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
