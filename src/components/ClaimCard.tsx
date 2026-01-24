'use client';

interface ClaimCardProps {
  claim: string;
}

export default function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 bg-terracotta-50 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-terracotta-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-1">Core Claim</h3>
          <p className="text-warm-900 leading-relaxed">{claim}</p>
        </div>
      </div>
    </div>
  );
}
