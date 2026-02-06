'use client';

import { useState } from 'react';
import { TranslateResponse } from '@/types';
import SlopGauge from './SlopGauge';
import ClaimCard from './ClaimCard';
import HoverDefinition from './HoverDefinition';
import HallucinationPanel from './HallucinationPanel';

interface ResultsPanelProps {
  result: TranslateResponse;
}

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

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Core Claim */}
      <ClaimCard claim={result.coreClaim} />

      {/* Main content grid */}
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
    </div>
  );
}
