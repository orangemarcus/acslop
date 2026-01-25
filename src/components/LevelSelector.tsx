'use client';

import { ComplexityLevel } from '@/types';

interface LevelSelectorProps {
  level: ComplexityLevel;
  onChange: (level: ComplexityLevel) => void;
  disabled?: boolean;
}

const LEVEL_LABELS: Record<ComplexityLevel, { short: string; desc: string }> = {
  1: { short: 'ELI10', desc: 'Ultra simple — 2-3 sentences' },
  2: { short: 'Simple', desc: 'High school level' },
  3: { short: 'Balanced', desc: 'Educated non-specialist' },
  4: { short: 'Detailed', desc: 'First-year university' },
  5: { short: 'Full', desc: 'Comprehensive breakdown' },
};

export default function LevelSelector({ level, onChange, disabled }: LevelSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-warm-800">Detail level</label>
        <span className="text-xs text-warm-600">{LEVEL_LABELS[level].desc}</span>
      </div>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as ComplexityLevel[]).map((l) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            disabled={disabled}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
              level === l
                ? 'bg-terracotta-500 text-white shadow-soft'
                : 'bg-cream-100 text-warm-600 hover:bg-cream-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {LEVEL_LABELS[l].short}
          </button>
        ))}
      </div>
    </div>
  );
}
