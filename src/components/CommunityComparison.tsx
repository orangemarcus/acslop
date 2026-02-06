'use client';

import { useState, useEffect } from 'react';

interface CommunityComparisonProps {
  score: number;
}

export default function CommunityComparison({ score }: CommunityComparisonProps) {
  const [percentile, setPercentile] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/community?section=percentile&score=${score}`)
      .then((r) => r.json())
      .then((data) => {
        setPercentile(data.percentile);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [score]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-warm-500 dark:text-warm-400">Loading community data...</span>
        </div>
      </div>
    );
  }

  if (percentile === null || total < 5) return null;

  const getMessage = () => {
    if (percentile >= 90) return { text: 'Exceptionally clear!', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentile >= 70) return { text: 'Clearer than most', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentile >= 50) return { text: 'Above average clarity', color: 'text-blue-600 dark:text-blue-400' };
    if (percentile >= 30) return { text: 'Below average clarity', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Needs improvement', color: 'text-red-600 dark:text-red-400' };
  };

  const msg = getMessage();

  // Position marker on the gradient bar
  const markerPosition = Math.max(2, Math.min(98, percentile));

  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
      <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Community Comparison
      </h3>

      {/* Main stat */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-warm-900 dark:text-warm-100">
          {percentile}<span className="text-lg">th</span>
        </div>
        <p className="text-sm text-warm-600 dark:text-warm-400 mt-0.5">percentile</p>
        <p className={`text-sm font-medium mt-1 ${msg.color}`}>
          {msg.text}
        </p>
      </div>

      {/* Visual bar */}
      <div className="relative mb-3">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-red-400 via-amber-400 via-blue-400 to-emerald-400 opacity-30" />
        <div className="h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-blue-500 to-emerald-500 absolute inset-0" style={{ clipPath: `inset(0 ${100 - markerPosition}% 0 0)` }} />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-warm-100 border-2 border-warm-800 dark:border-warm-200 rounded-full shadow-md"
          style={{ left: `${markerPosition}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-warm-400 dark:text-warm-500">
        <span>Most sloppy</span>
        <span>Clearest</span>
      </div>

      <p className="text-center text-[11px] text-warm-500 dark:text-warm-400 mt-3">
        Clearer than <strong className="text-warm-700 dark:text-warm-300">{percentile}%</strong> of {total.toLocaleString()} papers analyzed
      </p>

      <a
        href="/leaderboard"
        className="mt-3 flex items-center justify-center gap-1.5 text-xs text-terracotta-500 hover:text-terracotta-600 font-medium"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        View community leaderboard
      </a>
    </div>
  );
}
