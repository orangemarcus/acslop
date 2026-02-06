'use client';

import { useState } from 'react';
import { EXAMPLE_CATEGORIES } from '@/lib/examples';

interface ExampleBrowserProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function ExampleBrowser({ onSelect, disabled }: ExampleBrowserProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = EXAMPLE_CATEGORIES[activeCategory];

  return (
    <div>
      <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 px-1">
        Try an example
      </h3>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {EXAMPLE_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            disabled={disabled}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              i === activeCategory
                ? 'bg-terracotta-500 text-white shadow-soft'
                : 'bg-white dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-cream-50 dark:hover:bg-warm-700 border border-cream-300 dark:border-warm-700'
            } disabled:opacity-50`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Examples in selected category */}
      <div className="space-y-2.5">
        {category.examples.map((example) => (
          <button
            key={example.label}
            onClick={() => onSelect(example.text)}
            className="w-full text-left p-4 bg-white dark:bg-warm-800 hover:bg-cream-50 dark:hover:bg-warm-700 border border-cream-300 dark:border-warm-700 hover:border-cream-400 dark:hover:border-warm-600 rounded-xl text-sm text-warm-700 dark:text-warm-300 shadow-soft"
            disabled={disabled}
          >
            <span className="text-xs font-semibold text-terracotta-500 uppercase tracking-wider">
              {example.label}
            </span>
            <p className="mt-1 text-warm-600 dark:text-warm-400 line-clamp-2">
              &ldquo;{example.text.slice(0, 140)}...&rdquo;
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
