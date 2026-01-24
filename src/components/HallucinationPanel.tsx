'use client';

import { HallucinationFlag } from '@/types';

interface HallucinationPanelProps {
  hallucinations: HallucinationFlag[];
  totalCitations?: number;
}

const typeLabels: Record<HallucinationFlag['type'], string> = {
  fake_source: 'Fake Source',
  incomplete_citation: 'Incomplete Citation',
  suspicious_arxiv: 'Suspicious arXiv ID',
  fabricated_data: 'Fabricated Data',
  unverifiable_claim: 'Unverifiable Claim',
};

const severityStyles: Record<HallucinationFlag['severity'], { bg: string; border: string; dot: string }> = {
  high: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  low: { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
};

export default function HallucinationPanel({ hallucinations }: HallucinationPanelProps) {
  const verified = hallucinations.length === 0;
  const highCount = hallucinations.filter(h => h.severity === 'high').length;
  const mediumCount = hallucinations.filter(h => h.severity === 'medium').length;

  return (
    <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${verified ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {verified ? (
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-warm-900 text-sm">Hallucination Detector</h3>
          <p className="text-xs text-warm-600">
            {verified
              ? 'No suspicious citations or claims detected'
              : `${hallucinations.length} potential issue${hallucinations.length > 1 ? 's' : ''} found`
            }
          </p>
        </div>
      </div>

      {/* Summary bar */}
      {!verified && (
        <div className="flex gap-3 mb-4 text-xs">
          {highCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {highCount} high risk
            </span>
          )}
          {mediumCount > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {mediumCount} medium
            </span>
          )}
        </div>
      )}

      {/* Issue list */}
      {hallucinations.length > 0 && (
        <div className="space-y-3">
          {hallucinations.map((h, idx) => {
            const styles = severityStyles[h.severity];
            return (
              <div key={idx} className={`${styles.bg} border ${styles.border} rounded-xl p-3.5`}>
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-warm-800">
                        {typeLabels[h.type] || h.type}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-medium ${
                        h.severity === 'high' ? 'text-red-600' : h.severity === 'medium' ? 'text-amber-600' : 'text-yellow-600'
                      }`}>
                        {h.severity}
                      </span>
                    </div>
                    <p className="text-sm text-warm-800 font-mono bg-white/60 rounded px-2 py-1 mb-2 break-words">
                      &ldquo;{h.text}&rdquo;
                    </p>
                    <p className="text-xs text-warm-600 mb-1">{h.explanation}</p>
                    {h.suggestion && (
                      <p className="text-xs text-warm-600 italic">
                        Suggestion: {h.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clean bill */}
      {verified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-sm text-emerald-800">
            No fabricated citations, suspicious arXiv IDs, or unverifiable claims detected in this text.
          </p>
        </div>
      )}
    </div>
  );
}
