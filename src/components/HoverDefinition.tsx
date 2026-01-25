'use client';

import { useState } from 'react';
import { PhraseMapping } from '@/types';

interface HoverDefinitionProps {
  text: string;
  mappings: PhraseMapping[];
}

export default function HoverDefinition({ text, mappings }: HoverDefinitionProps) {
  const [hoveredMapping, setHoveredMapping] = useState<PhraseMapping | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const buildHighlightedText = () => {
    if (!mappings.length) {
      return <span>{text}</span>;
    }

    const sortedMappings = [...mappings].sort((a, b) => a.startIndex - b.startIndex);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMappings.forEach((mapping, idx) => {
      if (mapping.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{text.slice(lastIndex, mapping.startIndex)}</span>
        );
      }

      elements.push(
        <span
          key={`mapping-${idx}`}
          className="bg-terracotta-50 dark:bg-terracotta-500/20 border-b border-terracotta-500/40 cursor-help hover:bg-terracotta-100 dark:hover:bg-terracotta-500/30 rounded-sm px-0.5"
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({ x: rect.left, y: rect.bottom + 8 });
            setHoveredMapping(mapping);
          }}
          onMouseLeave={() => setHoveredMapping(null)}
        >
          {mapping.translatedPhrase}
        </span>
      );

      lastIndex = mapping.endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="relative">
      <p className="text-warm-800 dark:text-warm-200 leading-relaxed text-sm">{buildHighlightedText()}</p>

      {hoveredMapping && (
        <div
          className="fixed z-50 max-w-xs bg-warm-900 text-white text-sm rounded-xl shadow-lg p-4 pointer-events-none"
          style={{
            left: Math.min(tooltipPosition.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 300),
            top: tooltipPosition.y,
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-cream-300 mb-1">Original jargon</div>
          <div className="text-cream-100 mb-2.5 font-serif italic">&ldquo;{hoveredMapping.originalPhrase}&rdquo;</div>
          {hoveredMapping.explanation && (
            <>
              <div className="text-[10px] uppercase tracking-wider text-cream-300 mb-1">Why it obscures meaning</div>
              <div className="text-cream-200 text-xs">{hoveredMapping.explanation}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
