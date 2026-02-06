'use client';

import { ComplexityLevel } from '@/types';

interface LevelSelectorProps {
  level: ComplexityLevel;
  onChange: (level: ComplexityLevel) => void;
  disabled?: boolean;
  compact?: boolean;
}

const LEVEL_LABELS: Record<ComplexityLevel, { short: string; percent: string; desc: string }> = {
  1: { short: 'Minimal', percent: '10%', desc: '10% context — core point only' },
  2: { short: 'Simple', percent: '30%', desc: '30% context — main idea + key point' },
  3: { short: 'Balanced', percent: '50%', desc: '50% context — good overview' },
  4: { short: 'Detailed', percent: '70%', desc: '70% context — thorough explanation' },
  5: { short: 'Full', percent: '90%', desc: '90% context — nearly complete' },
};

export default function LevelSelector({ level, onChange, disabled, compact }: LevelSelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-warm-600">Detail:</span>
        <div className="flex gap-0.5">
          {([1, 2, 3, 4, 5] as ComplexityLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => onChange(l)}
              disabled={disabled}
              title={LEVEL_LABELS[l].desc}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                level === l
                  ? 'bg-terracotta-500 text-white'
                  : 'bg-cream-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-warm-500">{LEVEL_LABELS[level].percent}</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-warm-800 dark:text-warm-200">Detail level</label>
        <span className="text-xs text-warm-600 dark:text-warm-400">{LEVEL_LABELS[level].desc}</span>
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
                : 'bg-cream-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {LEVEL_LABELS[l].short}
          </button>
        ))}
      </div>
    </div>
  );
}
