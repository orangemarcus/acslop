'use client';

import { TranslateResponse } from '@/types';
import SlopGauge from './SlopGauge';
import ClaimCard from './ClaimCard';
import HoverDefinition from './HoverDefinition';
import HallucinationPanel from './HallucinationPanel';

interface ResultsPanelProps {
  result: TranslateResponse;
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
            <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta-500" />
              Original Text
            </h3>
            <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed font-serif italic">{result.original}</p>
          </div>

          {/* Translated text */}
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Plain English
              <span className="text-[10px] font-normal normal-case text-warm-600 dark:text-warm-500 tracking-normal">(hover highlighted phrases for original jargon)</span>
            </h3>
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
