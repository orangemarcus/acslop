'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';

interface OverviewData {
  stats: {
    totalTranslations: number;
    totalUsers: number;
    totalShares: number;
    avgSlopScore: number;
    bestScore: number;
    worstScore: number;
  };
  distribution: number[];
  activity: Array<{ date: string; count: number }>;
}

interface HallEntry {
  id: string;
  slopScore: number;
  preview: string;
  coreClaim: string;
  createdAt: string;
}

interface JargonEntry {
  jargon: string;
  plain: string;
  count: number;
}

type Tab = 'overview' | 'hallOfFame' | 'jargon';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-4 shadow-soft text-center">
      <p className="text-xs text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold" style={color ? { color } : undefined}>
        <span className="text-warm-900 dark:text-warm-100" style={color ? { color } : undefined}>{value}</span>
      </p>
      {sub && <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function DistributionChart({ distribution }: { distribution: number[] }) {
  const labels = ['0-19', '20-39', '40-59', '60-79', '80-100'];
  const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  const categoryLabels = ['Crystal Clear', 'Readable', 'Normal', 'Dense', 'Maximum Slop'];
  const total = distribution.reduce((s, c) => s + c, 0);
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="space-y-3">
      {distribution.map((count, i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[10px] text-warm-500 dark:text-warm-400 w-20 text-right">{categoryLabels[i]}</span>
            <div className="flex-1 h-5 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: colors[i] }}
              />
              <span className="absolute right-2 top-0.5 text-[10px] font-medium text-warm-600 dark:text-warm-300">
                {pct}%
              </span>
            </div>
            <span className="text-xs text-warm-500 dark:text-warm-400 w-10">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityChart({ activity }: { activity: Array<{ date: string; count: number }> }) {
  if (activity.length === 0) {
    return <p className="text-sm text-warm-400 text-center py-4">No activity yet</p>;
  }

  const maxCount = Math.max(...activity.map((a) => a.count), 1);

  return (
    <div className="flex items-end gap-1 h-24 overflow-x-auto">
      {activity.map((a, i) => {
        const height = Math.max(4, (a.count / maxCount) * 80);
        const dateLabel = new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 28 }}>
            <span className="text-[8px] text-warm-400">{a.count}</span>
            <div
              className="w-5 rounded-t-sm bg-terracotta-400 hover:bg-terracotta-500 transition-colors"
              style={{ height }}
              title={`${dateLabel}: ${a.count} translations`}
            />
            <span className="text-[7px] text-warm-400 whitespace-nowrap">{dateLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function HallOfFameCard({ entry, rank, type }: { entry: HallEntry; rank: number; type: 'clear' | 'slop' }) {
  const medal = rank === 0 ? '\u{1F947}' : rank === 1 ? '\u{1F948}' : rank === 2 ? '\u{1F949}' : null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 flex items-center justify-center w-8">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-xs text-warm-400 font-bold">#{rank + 1}</span>
        )}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: getSlopColor(entry.slopScore) }}
      >
        {entry.slopScore}
      </div>
      <div className="flex-1 min-w-0">
        {entry.coreClaim && (
          <p className="text-sm text-warm-800 dark:text-warm-200 font-medium truncate">{entry.coreClaim}</p>
        )}
        <p className="text-xs text-warm-500 dark:text-warm-400 truncate mt-0.5">{entry.preview}</p>
        <p className="text-[10px] text-warm-400 mt-0.5">
          {getSlopLabel(entry.slopScore)} &middot; {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [hall, setHall] = useState<{ clearest: HallEntry[]; sloppiest: HallEntry[] } | null>(null);
  const [jargon, setJargon] = useState<JargonEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const section = tab === 'overview' ? 'overview' : tab === 'hallOfFame' ? 'hallOfFame' : 'jargon';

    fetch(`/api/community?section=${section}`)
      .then((r) => r.json())
      .then((data) => {
        if (tab === 'overview') setOverview(data);
        else if (tab === 'hallOfFame') setHall(data);
        else setJargon(data.trending);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-cream-300 dark:border-warm-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-900 dark:text-warm-100">Community</h1>
                <p className="text-xs text-warm-600 dark:text-warm-400">Slop Index leaderboard</p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-cream-200 dark:bg-warm-700 rounded-lg p-1 w-fit">
          {([
            { key: 'overview' as Tab, label: 'Overview' },
            { key: 'hallOfFame' as Tab, label: 'Hall of Fame' },
            { key: 'jargon' as Tab, label: 'Trending Jargon' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-white dark:bg-warm-600 text-warm-900 dark:text-warm-100 shadow-soft'
                  : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-warm-500">
            <div className="w-5 h-5 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : tab === 'overview' && overview ? (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Translations" value={overview.stats.totalTranslations.toLocaleString()} sub="All time" />
              <StatCard label="Users" value={overview.stats.totalUsers.toLocaleString()} sub="Registered" />
              <StatCard label="Shared" value={overview.stats.totalShares.toLocaleString()} sub="Reports" />
              <StatCard label="Avg Score" value={overview.stats.avgSlopScore} sub={getSlopLabel(overview.stats.avgSlopScore)} color={getSlopColor(overview.stats.avgSlopScore)} />
              <StatCard label="Best" value={overview.stats.bestScore} sub="Clearest" color={getSlopColor(overview.stats.bestScore)} />
              <StatCard label="Worst" value={overview.stats.worstScore} sub="Most slop" color={getSlopColor(overview.stats.worstScore)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score distribution */}
              <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4">Score Distribution</h3>
                <DistributionChart distribution={overview.distribution} />
              </div>

              {/* Activity */}
              <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
                <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4">Recent Activity (14 days)</h3>
                <ActivityChart activity={overview.activity} />
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-4">
              <p className="text-sm text-warm-600 dark:text-warm-400 mb-3">
                Help grow the community! Every translation improves our benchmarks.
              </p>
              <Link href="/" className="inline-block px-5 py-2 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 text-sm shadow-soft">
                Translate a paper
              </Link>
            </div>
          </div>
        ) : tab === 'hallOfFame' && hall ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clearest */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200">Crystal Clear</h3>
                <span className="text-[10px] text-warm-400">(lowest slop scores)</span>
              </div>
              <div className="divide-y divide-cream-200 dark:divide-warm-700 px-5">
                {hall.clearest.length === 0 ? (
                  <p className="py-8 text-sm text-warm-400 text-center">No entries yet</p>
                ) : (
                  hall.clearest.map((entry, i) => (
                    <HallOfFameCard key={entry.id} entry={entry} rank={i} type="clear" />
                  ))
                )}
              </div>
            </div>

            {/* Sloppiest */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200">Maximum Slop</h3>
                <span className="text-[10px] text-warm-400">(highest slop scores)</span>
              </div>
              <div className="divide-y divide-cream-200 dark:divide-warm-700 px-5">
                {hall.sloppiest.length === 0 ? (
                  <p className="py-8 text-sm text-warm-400 text-center">No entries yet</p>
                ) : (
                  hall.sloppiest.map((entry, i) => (
                    <HallOfFameCard key={entry.id} entry={entry} rank={i} type="slop" />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : tab === 'jargon' && jargon ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700">
                <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200">Trending Academic Jargon</h3>
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
                  Most frequently flagged jargon across all translations, with plain English equivalents
                </p>
              </div>
              {jargon.length === 0 ? (
                <p className="px-5 py-10 text-sm text-warm-400 text-center">
                  Not enough data yet. More translations will populate this list!
                </p>
              ) : (
                <div className="divide-y divide-cream-200 dark:divide-warm-700">
                  {jargon.map((j, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-4">
                      <span className="text-xs font-bold text-warm-400 w-6 text-right">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-warm-800 dark:text-warm-200">{j.jargon}</span>
                          <svg className="w-3 h-3 text-warm-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">{j.plain}</span>
                        </div>
                      </div>
                      <span className="text-xs text-warm-400 flex-shrink-0">
                        {j.count}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
