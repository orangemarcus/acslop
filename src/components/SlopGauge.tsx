'use client';

import { SlopIndex } from '@/types';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';

interface SlopGaugeProps {
  slopIndex: SlopIndex;
}

export default function SlopGauge({ slopIndex }: SlopGaugeProps) {
  const { score, breakdown } = slopIndex;
  const label = getSlopLabel(score);
  const color = getSlopColor(score);

  // Calculate the progress ring
  const circumference = 2 * Math.PI * 36;
  const progress = (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-cream-300 p-5 shadow-soft">
      <h3 className="text-sm font-semibold text-warm-800 mb-4">Complexity Index</h3>

      {/* Circular gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#F0EBE3"
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
            <span className="text-2xl font-bold text-warm-900">{score}</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color, backgroundColor: `${color}15` }}>
          {label}
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {[
          { label: 'Passive Voice', value: `${breakdown.passiveVoice}%` },
          { label: 'Nominalizations', value: String(breakdown.nominalizations) },
          { label: 'Hedge Words', value: String(breakdown.hedgeWords) },
          { label: 'Jargon Density', value: `${breakdown.jargonDensity}/sent` },
          { label: 'Avg Sentence Length', value: `${breakdown.sentenceLength} words` },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-center text-xs">
            <span className="text-warm-600">{item.label}</span>
            <span className="font-medium text-warm-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
