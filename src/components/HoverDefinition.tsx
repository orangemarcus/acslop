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

  // Build highlighted text with hoverable spans
  const buildHighlightedText = () => {
    if (!mappings.length) {
      return <span>{text}</span>;
    }

    // Sort mappings by start index
    const sortedMappings = [...mappings].sort((a, b) => a.startIndex - b.startIndex);

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMappings.forEach((mapping, idx) => {
      // Add text before this mapping
      if (mapping.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>{text.slice(lastIndex, mapping.startIndex)}</span>
        );
      }

      // Add the highlighted mapping
      elements.push(
        <span
          key={`mapping-${idx}`}
          className="bg-yellow-100 border-b border-yellow-400 cursor-help transition-colors hover:bg-yellow-200"
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

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="relative">
      <p className="text-gray-800 leading-relaxed">{buildHighlightedText()}</p>

      {/* Tooltip */}
      {hoveredMapping && (
        <div
          className="fixed z-50 max-w-xs bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: Math.min(tooltipPosition.x, window.innerWidth - 300),
            top: tooltipPosition.y,
          }}
        >
          <div className="font-medium text-yellow-300 mb-1">Original:</div>
          <div className="text-gray-200 mb-2">&ldquo;{hoveredMapping.originalPhrase}&rdquo;</div>
          {hoveredMapping.explanation && (
            <>
              <div className="font-medium text-yellow-300 mb-1">Why it&apos;s slop:</div>
              <div className="text-gray-300 text-xs">{hoveredMapping.explanation}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
