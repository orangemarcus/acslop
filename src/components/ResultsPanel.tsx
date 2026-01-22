'use client';

import { TranslateResponse } from '@/types';
import SlopGauge from './SlopGauge';
import ClaimCard from './ClaimCard';
import HoverDefinition from './HoverDefinition';

interface ResultsPanelProps {
  result: TranslateResponse;
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Core Claim */}
      <ClaimCard claim={result.coreClaim} />

      {/* Side-by-side view + Slop Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Original text */}
        <div className="lg:col-span-1">
          <div className="bg-red-50 rounded-lg border border-red-200 p-4 h-full">
            <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Original Academic Slop
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">{result.original}</p>
          </div>
        </div>

        {/* Translated text */}
        <div className="lg:col-span-1">
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 h-full">
            <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Plain English
              <span className="text-xs font-normal text-green-600">(hover highlighted phrases)</span>
            </h3>
            <HoverDefinition text={result.translated} mappings={result.mappings} />
          </div>
        </div>

        {/* Slop Gauge */}
        <div className="lg:col-span-1">
          <SlopGauge slopIndex={result.slopIndex} />
        </div>
      </div>
    </div>
  );
}
