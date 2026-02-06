'use client';

import { useState, useRef, useEffect } from 'react';
import { TranslateResponse } from '@/types';
import SlopGauge from './SlopGauge';
import ClaimCard from './ClaimCard';
import HoverDefinition from './HoverDefinition';
import HallucinationPanel from './HallucinationPanel';
import { getSlopLabel } from '@/lib/slopCalculator';

interface ResultsPanelProps {
  result: TranslateResponse;
}

type ResultsLayout = 'stacked' | 'sideBySide';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-cream-100 dark:hover:bg-warm-700 transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function buildMarkdownExport(result: TranslateResponse): string {
  const { original, translated, coreClaim, slopIndex, hallucinations } = result;
  const label = getSlopLabel(slopIndex.score);
  const b = slopIndex.breakdown;

  let md = `# Translation Summary\n\n`;
  md += `## Core Claim\n${coreClaim}\n\n`;
  md += `## Original Text\n> ${original}\n\n`;
  md += `## Plain English\n${translated}\n\n`;
  md += `## Slop Index: ${slopIndex.score}/100 (${label})\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Passive Voice | ${b.passiveVoice}% |\n`;
  md += `| Nominalizations | ${b.nominalizations} |\n`;
  md += `| Hedge Words | ${b.hedgeWords} |\n`;
  md += `| Jargon Density | ${b.jargonDensity}/sent |\n`;
  md += `| Avg Sentence Length | ${b.sentenceLength} words |\n\n`;

  if (hallucinations.length > 0) {
    md += `## Hallucination Flags (${hallucinations.length})\n`;
    hallucinations.forEach((h, i) => {
      md += `${i + 1}. **[${h.severity.toUpperCase()}]** ${h.type}: "${h.text}"\n   ${h.explanation}\n`;
      if (h.suggestion) md += `   *Suggestion: ${h.suggestion}*\n`;
      md += `\n`;
    });
  } else {
    md += `## Hallucination Check\nNo suspicious citations or claims detected.\n`;
  }

  return md;
}

function buildPlainTextExport(result: TranslateResponse): string {
  const { original, translated, coreClaim, slopIndex, hallucinations } = result;
  const label = getSlopLabel(slopIndex.score);
  const b = slopIndex.breakdown;

  let txt = `CORE CLAIM\n${coreClaim}\n\n`;
  txt += `ORIGINAL TEXT\n${original}\n\n`;
  txt += `PLAIN ENGLISH\n${translated}\n\n`;
  txt += `SLOP INDEX: ${slopIndex.score}/100 (${label})\n`;
  txt += `  Passive Voice: ${b.passiveVoice}%\n`;
  txt += `  Nominalizations: ${b.nominalizations}\n`;
  txt += `  Hedge Words: ${b.hedgeWords}\n`;
  txt += `  Jargon Density: ${b.jargonDensity}/sent\n`;
  txt += `  Avg Sentence Length: ${b.sentenceLength} words\n\n`;

  if (hallucinations.length > 0) {
    txt += `HALLUCINATION FLAGS (${hallucinations.length})\n`;
    hallucinations.forEach((h, i) => {
      txt += `${i + 1}. [${h.severity.toUpperCase()}] ${h.type}: "${h.text}"\n   ${h.explanation}\n`;
      if (h.suggestion) txt += `   Suggestion: ${h.suggestion}\n`;
      txt += `\n`;
    });
  } else {
    txt += `HALLUCINATION CHECK\nNo suspicious citations or claims detected.\n`;
  }

  return txt;
}

function ExportMenu({ result }: { result: TranslateResponse }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setStatus(`${label} copied`);
    }
    setTimeout(() => { setStatus(null); setOpen(false); }, 1500);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded');
    setTimeout(() => { setStatus(null); setOpen(false); }, 1500);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-cream-100 dark:hover:bg-warm-700 transition-colors"
        aria-label="Export results"
        aria-expanded={open}
      >
        {status ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {status}
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </>
        )}
      </button>

      {open && !status && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => copyToClipboard(buildMarkdownExport(result), 'Markdown')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy as Markdown
          </button>
          <button
            onClick={() => copyToClipboard(buildPlainTextExport(result), 'Text')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Copy as plain text
          </button>
          <div className="border-t border-cream-200 dark:border-warm-700" />
          <button
            onClick={() => downloadFile(buildMarkdownExport(result), 'translation.md')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .md file
          </button>
          <button
            onClick={() => downloadFile(buildPlainTextExport(result), 'translation.txt')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download .txt file
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  const [layout, setLayout] = useState<ResultsLayout>('stacked');

  return (
    <div className="space-y-6">
      {/* Core Claim */}
      <ClaimCard claim={result.coreClaim} />

      {/* Toolbar: layout toggle + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-cream-200 dark:bg-warm-700 rounded-lg p-0.5">
          <button
            onClick={() => setLayout('stacked')}
            aria-pressed={layout === 'stacked'}
            aria-label="Stacked view"
            title="Stacked view"
            className={`p-1.5 rounded-md transition-all ${
              layout === 'stacked'
                ? 'bg-white dark:bg-warm-600 text-warm-800 dark:text-warm-100 shadow-soft'
                : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setLayout('sideBySide')}
            aria-pressed={layout === 'sideBySide'}
            aria-label="Side by side view"
            title="Side by side view"
            className={`p-1.5 rounded-md transition-all ${
              layout === 'sideBySide'
                ? 'bg-white dark:bg-warm-600 text-warm-800 dark:text-warm-100 shadow-soft'
                : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16M4 4h16v16H4z" />
            </svg>
          </button>
        </div>
        <ExportMenu result={result} />
      </div>

      {/* Main content grid */}
      {layout === 'stacked' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Original + Translation */}
          <div className="lg:col-span-8 space-y-5">
            {/* Original text */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                  Original Text
                </h3>
                <CopyButton text={result.original} label="original text" />
              </div>
              <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed font-serif italic">{result.original}</p>
            </div>

            {/* Translated text */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Plain English
                  <span className="text-[10px] font-normal normal-case text-warm-600 dark:text-warm-500 tracking-normal">(hover highlighted phrases for original jargon)</span>
                </h3>
                <CopyButton text={result.translated} label="translation" />
              </div>
              <HoverDefinition text={result.translated} mappings={result.mappings} />
            </div>
          </div>

          {/* Right column: Gauges */}
          <div className="lg:col-span-4 space-y-5">
            <SlopGauge slopIndex={result.slopIndex} />
            <HallucinationPanel hallucinations={result.hallucinations} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                  Original
                </h3>
                <CopyButton text={result.original} label="original text" />
              </div>
              <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed font-serif italic">{result.original}</p>
            </div>

            {/* Translated */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Plain English
                </h3>
                <CopyButton text={result.translated} label="translation" />
              </div>
              <HoverDefinition text={result.translated} mappings={result.mappings} />
            </div>
          </div>

          {/* Analysis row below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlopGauge slopIndex={result.slopIndex} />
            <HallucinationPanel hallucinations={result.hallucinations} />
          </div>
        </div>
      )}
    </div>
  );
}
