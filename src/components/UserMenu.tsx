'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface QuotaInfo {
  used: number;
  limit: number;
  resetsIn: string;
}

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && session?.user) {
      fetch('/api/usage')
        .then((r) => r.json())
        .then((data) => {
          if (data.quota) setQuota(data.quota);
        })
        .catch(() => {});
    }
  }, [open, session]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-cream-200 dark:bg-warm-700 animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn()}
        className="text-sm font-medium text-terracotta-500 hover:text-terracotta-600 px-3 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700 flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Sign in
      </button>
    );
  }

  const user = session.user;
  const isPro = (user as { plan?: string }).plan === 'pro';
  const initials = (user.name || user.email || '?')
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="w-7 h-7 rounded-full border border-cream-300 dark:border-warm-600"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-terracotta-500 text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
          )}
          {isPro && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl shadow-lg z-30 overflow-hidden view-enter">
          {/* User info */}
          <div className="px-4 py-3 border-b border-cream-200 dark:border-warm-700">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">{user.name}</p>
              {isPro && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Pro
                </span>
              )}
            </div>
            <p className="text-xs text-warm-500 dark:text-warm-400 truncate">{user.email}</p>
          </div>

          {/* Quota */}
          {quota && (
            <div className="px-4 py-3 border-b border-cream-200 dark:border-warm-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-warm-600 dark:text-warm-400">Monthly usage</span>
                <span className="text-xs font-medium text-warm-800 dark:text-warm-200">
                  {quota.used} / {quota.limit}
                </span>
              </div>
              <div className="h-1.5 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.used >= quota.limit ? 'bg-red-500' : quota.used > quota.limit * 0.8 ? 'bg-amber-500' : 'bg-terracotta-500'
                  }`}
                  style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-warm-500 dark:text-warm-500 mt-1">
                Resets in {quota.resetsIn}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="p-1.5 space-y-0.5">
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 rounded-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </a>
            <a
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 rounded-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Community leaderboard
            </a>
            <a
              href="/settings/api"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 rounded-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API keys
            </a>
            <a
              href="/pricing"
              onClick={() => setOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 rounded-lg flex items-center gap-2"
            >
              {isPro ? (
                <>
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Manage subscription
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-terracotta-500 font-medium">Upgrade to Pro</span>
                </>
              )}
            </a>
            <button
              onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 rounded-lg flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
