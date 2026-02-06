'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProfileForm {
  name: string;
  bio: string;
  slug: string;
}

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({ name: '', bio: '', slug: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings/profile');
      return;
    }
    if (session?.user) {
      fetch('/api/profile')
        .then((r) => r.json())
        .then((data) => {
          if (data.profile) {
            setForm({
              name: data.profile.name || '',
              bio: data.profile.bio || '',
              slug: data.profile.slug || '',
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session, status, router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: form.bio,
          profileSlug: form.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated!' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setSaving(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-warm-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-warm-900">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Profile Settings</h1>
        </div>

        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft space-y-5">
          {/* Name (read-only, from auth provider) */}
          <div>
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              disabled
              className="w-full px-3 py-2 text-sm bg-cream-100 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-500 dark:text-warm-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-1">Name is set by your sign-in provider.</p>
          </div>

          {/* Profile URL slug */}
          <div>
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1.5">Profile URL</label>
            <div className="flex items-center">
              <span className="text-xs text-warm-400 dark:text-warm-500 mr-1">/profile/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="your-username"
                maxLength={30}
                className="flex-1 px-3 py-2 text-sm bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
              />
            </div>
            <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-1">Only lowercase letters, numbers, hyphens, underscores. This makes your profile publicly viewable.</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 resize-none"
            />
            <p className="text-[10px] text-warm-400 dark:text-warm-500 mt-1">{form.bio.length}/200</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* View profile link */}
          {form.slug && (
            <p className="text-center text-xs text-warm-500 dark:text-warm-400">
              <Link href={`/profile/${form.slug}`} className="text-terracotta-500 hover:text-terracotta-600">
                View your public profile
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
