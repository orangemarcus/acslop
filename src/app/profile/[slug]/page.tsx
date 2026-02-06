'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getSlopColor, getSlopLabel } from '@/lib/slopCalculator';
import { ACHIEVEMENTS } from '@/lib/achievementDefs';

interface ProfileData {
  profile: {
    id: string; name: string | null; image: string | null; bio: string | null;
    slug: string | null; plan: string; createdAt: string; isOwn: boolean;
  };
  stats: {
    translations: number; shares: number; followers: number; following: number;
    avgSlopScore: number; achievements: number;
  };
  achievements: Array<{ id: string; unlockedAt: string }>;
  recentShares: Array<{
    shareId: string; title: string | null; views: number;
    slopScore: number; preview: string; createdAt: string;
  }>;
  isFollowing: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/profile?slug=${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setFollowing(d.isFollowing); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleFollow = async () => {
    if (!data || !session?.user) return;
    setFollowLoading(true);
    if (following) {
      await fetch(`/api/follow?userId=${data.profile.id}`, { method: 'DELETE' });
      setFollowing(false);
      setData((p) => p ? { ...p, stats: { ...p.stats, followers: p.stats.followers - 1 } } : p);
    } else {
      await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.profile.id }),
      });
      setFollowing(true);
      setData((p) => p ? { ...p, stats: { ...p.stats, followers: p.stats.followers + 1 } } : p);
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-serif text-warm-900 dark:text-warm-100 mb-2">Profile Not Found</h1>
          <Link href="/" className="text-sm text-terracotta-500">Go home</Link>
        </div>
      </div>
    );
  }

  const { profile, stats, achievements, recentShares } = data;
  const achievementDefs = achievements.map((a) => ACHIEVEMENTS.find((d) => d.id === a.id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-warm-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <Link href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200 inline-flex items-center gap-1 mb-6 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

        {/* Profile header */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft mb-6">
          <div className="flex items-start gap-4">
            {profile.image ? (
              <img src={profile.image} alt="" className="w-16 h-16 rounded-2xl border border-cream-300 dark:border-warm-600" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-terracotta-500 text-white text-xl font-bold flex items-center justify-center">
                {(profile.name || '?')[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-warm-900 dark:text-warm-100">{profile.name || 'Anonymous'}</h1>
                {profile.plan === 'pro' && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    Pro
                  </span>
                )}
              </div>
              {profile.bio && <p className="text-sm text-warm-600 dark:text-warm-400 mb-2">{profile.bio}</p>}
              <p className="text-xs text-warm-400 dark:text-warm-500">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {!profile.isOwn && session?.user && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  following
                    ? 'bg-cream-200 dark:bg-warm-700 text-warm-700 dark:text-warm-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                    : 'bg-terracotta-500 text-white hover:bg-terracotta-600'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
            {profile.isOwn && (
              <Link
                href="/settings/profile"
                className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-cream-200 dark:bg-warm-700 text-warm-700 dark:text-warm-300 rounded-xl hover:bg-cream-300 dark:hover:bg-warm-600"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-cream-200 dark:border-warm-700">
            {[
              { label: 'Translations', value: stats.translations },
              { label: 'Shared', value: stats.shares },
              { label: 'Followers', value: stats.followers },
              { label: 'Following', value: stats.following },
              { label: 'Avg Score', value: stats.avgSlopScore },
              { label: 'Badges', value: stats.achievements },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-warm-900 dark:text-warm-100">{s.value}</p>
                <p className="text-[10px] text-warm-500 dark:text-warm-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        {achievementDefs.length > 0 && (
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft mb-6">
            <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-3">Achievements ({achievementDefs.length})</h2>
            <div className="flex flex-wrap gap-2">
              {achievementDefs.map((a) => {
                if (!a) return null;
                const colorMap: Record<string, string> = {
                  blue: '#3b82f6', emerald: '#10b981', purple: '#8b5cf6', amber: '#f59e0b',
                  cyan: '#06b6d4', red: '#ef4444', pink: '#ec4899', indigo: '#6366f1',
                  orange: '#f97316', violet: '#7c3aed',
                };
                const hex = colorMap[a.color] || '#C96442';
                return (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                    style={{ borderColor: hex + '40', backgroundColor: hex + '10', color: hex }}
                    title={a.description}
                  >
                    {a.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent shared reports */}
        {recentShares.length > 0 && (
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700">
              <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200">Shared Reports</h2>
            </div>
            <div className="divide-y divide-cream-200 dark:divide-warm-700">
              {recentShares.map((s) => (
                <Link
                  key={s.shareId}
                  href={`/report/${s.shareId}`}
                  className="px-5 py-3 flex items-center gap-4 hover:bg-cream-50 dark:hover:bg-warm-750 transition-colors block"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: getSlopColor(s.slopScore) }}
                  >
                    {s.slopScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-warm-800 dark:text-warm-200 truncate">
                      {s.title || s.preview}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
                      {getSlopLabel(s.slopScore)} &middot; {s.views} views &middot; {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
