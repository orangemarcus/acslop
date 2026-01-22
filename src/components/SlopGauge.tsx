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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Academic Slop Index</h3>

      {/* Main gauge */}
      <div className="relative mb-4">
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Background arc */}
            <div
              className="absolute inset-0 rounded-t-full border-8 border-gray-200"
              style={{ borderBottomWidth: 0 }}
            />
            {/* Filled arc - using a pseudo element approach with rotation */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-14 origin-bottom transition-transform duration-500"
              style={{
                transform: `translateX(-50%) rotate(${(score / 100) * 180 - 90}deg)`,
                background: color
              }}
            />
            {/* Center cover */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-white rounded-t-full" />
          </div>
        </div>

        {/* Score display */}
        <div className="text-center -mt-2">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
        <div className="text-center mt-1">
          <span className="text-sm font-medium" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Passive Voice</span>
          <span className="font-medium text-gray-900">{breakdown.passiveVoice}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Nominalizations</span>
          <span className="font-medium text-gray-900">{breakdown.nominalizations}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Hedge Words</span>
          <span className="font-medium text-gray-900">{breakdown.hedgeWords}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Jargon Density</span>
          <span className="font-medium text-gray-900">{breakdown.jargonDensity}/sent</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Avg Sentence Length</span>
          <span className="font-medium text-gray-900">{breakdown.sentenceLength} words</span>
        </div>
      </div>
    </div>
  );
}
