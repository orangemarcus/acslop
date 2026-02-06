'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminStats {
  users: { total: number; thisMonth: number; proUsers: number };
  translations: { total: number; thisMonth: number; avgScore: number; cacheHits: number };
  api: { totalKeys: number; activeKeys: number; apiRequests: number };
  topUsers: Array<{ id: string; name: string | null; email: string | null; plan: string; translations: number }>;
  recentActivity: Array<{ date: string; translations: number; users: number }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session?.user) {
      fetch('/api/admin/stats')
        .then((r) => {
          if (r.status === 403) throw new Error('Access denied. Admin only.');
          return r.json();
        })
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setStats(data);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-warm-700 dark:text-warm-300 font-medium">{error}</p>
          <a href="/" className="mt-3 inline-block text-sm text-terracotta-500 hover:text-terracotta-600">Go home</a>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Users', value: stats.users.total, sub: `${stats.users.thisMonth} this month`, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Pro Users', value: stats.users.proUsers, sub: `${((stats.users.proUsers / Math.max(1, stats.users.total)) * 100).toFixed(1)}% conversion`, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total Translations', value: stats.translations.total, sub: `${stats.translations.thisMonth} this month`, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Avg Slop Score', value: stats.translations.avgScore, sub: 'across all translations', color: 'text-terracotta-600 dark:text-terracotta-400' },
    { label: 'Cache Hits', value: stats.translations.cacheHits, sub: 'translations served from cache', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'API Keys', value: stats.api.activeKeys, sub: `${stats.api.apiRequests} total API requests`, color: 'text-cyan-600 dark:text-cyan-400' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-warm-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Admin Dashboard</h1>
          </div>
          <p className="text-warm-600 dark:text-warm-400 text-sm">Platform analytics and user management</p>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft"
            >
              <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-[11px] text-warm-400 dark:text-warm-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Activity chart */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft mb-8">
          <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4">Daily Activity (Last 14 Days)</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {stats.recentActivity.map((day) => {
                const maxT = Math.max(...stats.recentActivity.map((d) => d.translations), 1);
                const height = Math.max(4, (day.translations / maxT) * 100);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-warm-500 dark:text-warm-400">{day.translations}</span>
                    <div
                      className="w-full bg-terracotta-400 dark:bg-terracotta-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-warm-400 dark:text-warm-500 -rotate-45 origin-top-left mt-1">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-warm-400 dark:text-warm-500">No activity data</p>
          )}
        </div>

        {/* Top users table */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft">
          <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-4">Top Users by Translations</h2>
          {stats.topUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-cream-200 dark:border-warm-700">
                    <th className="text-left py-2 px-2 text-warm-500 dark:text-warm-400 font-medium">#</th>
                    <th className="text-left py-2 px-2 text-warm-500 dark:text-warm-400 font-medium">User</th>
                    <th className="text-left py-2 px-2 text-warm-500 dark:text-warm-400 font-medium">Plan</th>
                    <th className="text-right py-2 px-2 text-warm-500 dark:text-warm-400 font-medium">Translations</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.map((u, i) => (
                    <tr key={u.id} className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 text-warm-400">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span className="text-warm-800 dark:text-warm-200 font-medium">{u.name || 'Anonymous'}</span>
                        <span className="text-warm-400 dark:text-warm-500 ml-1">{u.email}</span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          u.plan === 'pro'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-cream-100 text-warm-600 dark:bg-warm-700 dark:text-warm-400'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-warm-700 dark:text-warm-300">
                        {u.translations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-warm-400 dark:text-warm-500">No users yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
