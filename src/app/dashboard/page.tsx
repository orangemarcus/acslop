'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';

interface DashboardData {
  stats: {
    totalTranslations: number;
    avgSlopScore: number;
    bestScore: number;
    sharedCount: number;
  };
  clarityTrend: Array<{ date: string; avgScore: number; count: number }>;
  levelCounts: Record<number, number>;
  recent: Array<{
    id: string;
    inputText: string;
    level: number;
    slopScore: number;
    createdAt: string;
  }>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
      <p className="text-xs text-warm-500 dark:text-warm-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold" style={color ? { color } : undefined}>
        <span className="text-warm-900 dark:text-warm-100" style={color ? { color } : undefined}>{value}</span>
      </p>
      {sub && <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ date: string; avgScore: number; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-warm-400 dark:text-warm-500">
        No data yet. Translate some papers to see your trend!
      </div>
    );
  }

  const maxScore = 100;
  const barWidth = Math.max(12, Math.min(32, Math.floor(600 / data.length)));

  return (
    <div className="h-40 flex items-end gap-1 overflow-x-auto pb-6 relative">
      {data.map((d, i) => {
        const height = Math.max(4, (d.avgScore / maxScore) * 130);
        const color = getSlopColor(d.avgScore);
        const dateLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: barWidth }}>
            <span className="text-[9px] text-warm-500 dark:text-warm-400">{d.avgScore}</span>
            <div
              className="rounded-t-md transition-all hover:opacity-80"
              style={{ height, backgroundColor: color, width: barWidth - 4 }}
              title={`${dateLabel}: avg ${d.avgScore}/100 (${d.count} translation${d.count > 1 ? 's' : ''})`}
            />
            <span className="text-[8px] text-warm-400 dark:text-warm-500 whitespace-nowrap">{dateLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function LevelPieChart({ counts }: { counts: Record<number, number> }) {
  const levels = [
    { level: 1, label: 'ELI5', color: '#22c55e' },
    { level: 2, label: 'Simple', color: '#84cc16' },
    { level: 3, label: 'Medium', color: '#eab308' },
    { level: 4, label: 'Detailed', color: '#f97316' },
    { level: 5, label: 'Expert', color: '#ef4444' },
  ];

  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-2">
      {levels.map(({ level, label, color }) => {
        const count = counts[level] || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={level} className="flex items-center gap-3">
            <span className="text-xs text-warm-600 dark:text-warm-400 w-16">{label}</span>
            <div className="flex-1 h-2 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs text-warm-500 dark:text-warm-400 w-12 text-right">{count} ({pct}%)</span>
          </div>
        );
      })}
    </div>
  );
}

interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [achievements, setAchievements] = useState<AchievementInfo[]>([]);
  const [achievementStats, setAchievementStats] = useState({ unlocked: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/dashboard')
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
      fetch('/api/achievements')
        .then((r) => r.json())
        .then((d) => {
          if (d.achievements) setAchievements(d.achievements);
          setAchievementStats({ unlocked: d.unlocked || 0, total: d.total || 0 });
        })
        .catch(() => {});
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-center justify-center gap-3 text-warm-500">
            <div className="w-5 h-5 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user || !data) {
    return null;
  }

  const { stats, clarityTrend, levelCounts, recent } = data;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-cream-300 dark:border-warm-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-warm-900 dark:text-warm-100">Your Dashboard</h1>
                  <p className="text-xs text-warm-600 dark:text-warm-400">Translation stats & insights</p>
                </div>
              </Link>
            </div>
            <Link
              href="/"
              className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Translator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-serif text-warm-900 dark:text-warm-100">
            Welcome back, {session.user.name || 'Scholar'}
          </h2>
          <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
            Here&apos;s an overview of your translation activity.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Translations"
            value={stats.totalTranslations}
            sub="All time"
          />
          <StatCard
            label="Avg Slop Score"
            value={stats.avgSlopScore}
            sub={getSlopLabel(stats.avgSlopScore)}
            color={getSlopColor(stats.avgSlopScore)}
          />
          <StatCard
            label="Best Score"
            value={stats.bestScore}
            sub={stats.totalTranslations > 0 ? getSlopLabel(stats.bestScore) : 'N/A'}
            color={stats.totalTranslations > 0 ? getSlopColor(stats.bestScore) : undefined}
          />
          <StatCard
            label="Shared Reports"
            value={stats.sharedCount}
            sub="Public links"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clarity trend */}
          <div className="lg:col-span-2 bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Slop Score Trend
              <span className="text-xs font-normal text-warm-500 dark:text-warm-400">(lower is clearer)</span>
            </h3>
            <MiniBarChart data={clarityTrend} />
          </div>

          {/* Level distribution */}
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Level Distribution
            </h3>
            <LevelPieChart counts={levelCounts} />
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Achievements
              </h3>
              <span className="text-xs text-warm-500 dark:text-warm-400">
                {achievementStats.unlocked} / {achievementStats.total} unlocked
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {achievements.map((a) => {
                const colorMap: Record<string, string> = {
                  blue: '#3b82f6', emerald: '#10b981', purple: '#8b5cf6', amber: '#f59e0b',
                  cyan: '#06b6d4', red: '#ef4444', pink: '#ec4899', indigo: '#6366f1',
                  orange: '#f97316', violet: '#7c3aed',
                };
                const hex = colorMap[a.color] || '#C96442';
                return (
                  <div
                    key={a.id}
                    className={`text-center p-3 rounded-xl border transition-all ${
                      a.unlocked
                        ? 'bg-cream-50 dark:bg-warm-750 border-cream-300 dark:border-warm-600'
                        : 'bg-cream-50/50 dark:bg-warm-800 border-cream-200 dark:border-warm-700 opacity-40'
                    }`}
                    title={`${a.name}: ${a.description}${a.unlockedAt ? ` (Unlocked ${new Date(a.unlockedAt).toLocaleDateString()})` : ' (Locked)'}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-1.5 flex items-center justify-center"
                      style={{ backgroundColor: a.unlocked ? hex + '20' : '#9ca3af20' }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke={a.unlocked ? hex : '#9ca3af'}
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-medium text-warm-700 dark:text-warm-300 truncate">{a.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent translations */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700">
            <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Translations
            </h3>
          </div>

          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-warm-400 dark:text-warm-500">
              No translations yet.{' '}
              <Link href="/" className="text-terracotta-500 hover:text-terracotta-600 font-medium">
                Translate your first paper!
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-200 dark:divide-warm-700">
              {recent.map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-center gap-4 hover:bg-cream-50 dark:hover:bg-warm-750 transition-colors">
                  {/* Score badge */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: getSlopColor(t.slopScore) }}
                  >
                    {t.slopScore}
                  </div>

                  {/* Text preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-warm-800 dark:text-warm-200 truncate">
                      {t.inputText}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
                      Level {t.level} &middot; {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Label */}
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: getSlopColor(t.slopScore) + '20',
                      color: getSlopColor(t.slopScore),
                    }}
                  >
                    {getSlopLabel(t.slopScore)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
