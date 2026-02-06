'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSlopColor, getSlopLabel } from '@/lib/slopCalculator';

interface FeedItem {
  shareId: string;
  title: string | null;
  views: number;
  commentCount: number;
  slopScore: number;
  preview: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null; slug: string | null };
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/feed');
      return;
    }
    if (session?.user) {
      fetch('/api/follow?section=feed')
        .then((r) => r.json())
        .then((data) => setFeed(data.feed || []))
        .catch(() => {})
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

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-warm-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Activity Feed</h1>
            </div>
            <p className="text-warm-600 dark:text-warm-400 text-sm">Recent reports from people you follow</p>
          </div>
          <Link
            href="/leaderboard"
            className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium"
          >
            Discover users
          </Link>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700">
            <svg className="w-12 h-12 text-warm-300 dark:text-warm-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-warm-700 dark:text-warm-300 font-medium mb-1">Your feed is empty</p>
            <p className="text-sm text-warm-500 dark:text-warm-400 mb-4">
              Follow other users to see their shared reports here.
            </p>
            <Link
              href="/leaderboard"
              className="inline-block px-4 py-2 bg-terracotta-500 text-white text-sm font-medium rounded-xl hover:bg-terracotta-600"
            >
              Discover the community
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item) => (
              <div
                key={item.shareId}
                className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-4 shadow-soft"
              >
                {/* Author header */}
                <div className="flex items-center gap-2 mb-3">
                  {item.author.image ? (
                    <img src={item.author.image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-terracotta-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {(item.author.name || '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  {item.author.slug ? (
                    <a href={`/profile/${item.author.slug}`} className="text-xs font-medium text-warm-800 dark:text-warm-200 hover:text-terracotta-500">
                      {item.author.name || 'Anonymous'}
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-warm-800 dark:text-warm-200">{item.author.name || 'Anonymous'}</span>
                  )}
                  <span className="text-[10px] text-warm-400 dark:text-warm-500">
                    shared a report &middot; {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Content */}
                <Link href={`/report/${item.shareId}`} className="block hover:opacity-90 transition-opacity">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                      style={{ backgroundColor: getSlopColor(item.slopScore) }}
                    >
                      {item.slopScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-200 mb-0.5">
                        {item.title || getSlopLabel(item.slopScore) + ' — Slop Score ' + item.slopScore}
                      </p>
                      <p className="text-xs text-warm-600 dark:text-warm-400 line-clamp-2">{item.preview}</p>
                    </div>
                  </div>
                </Link>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-cream-100 dark:border-warm-750">
                  <span className="text-[10px] text-warm-400 dark:text-warm-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {item.views}
                  </span>
                  <span className="text-[10px] text-warm-400 dark:text-warm-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {item.commentCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
