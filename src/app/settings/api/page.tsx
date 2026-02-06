'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  requests: number;
  active: boolean;
  createdAt: string;
}

export default function ApiSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(() => {
    fetch('/api/api-keys')
      .then((r) => r.json())
      .then((data) => setKeys(data.keys || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session?.user) fetchKeys();
  }, [session, status, router, fetchKeys]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKeyValue(data.key);
        fetchKeys();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
    fetchKeys();
  };

  const copyKey = async () => {
    if (!newKeyValue) return;
    try {
      await navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
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
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">API Keys</h1>
          </div>
          <p className="text-warm-600 dark:text-warm-400 text-sm">
            Manage API keys for programmatic access to ACSLOP. Keys use your account&apos;s quota.
          </p>
          <a href="/docs/api" className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium mt-1 inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            View API documentation
          </a>
        </div>

        {/* New key reveal */}
        {newKeyValue && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                  API key created! Copy it now — you won&apos;t see it again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-warm-800 border border-emerald-200 dark:border-warm-700 rounded-lg px-3 py-2 font-mono text-warm-800 dark:text-warm-200 break-all">
                    {newKeyValue}
                  </code>
                  <button
                    onClick={copyKey}
                    className="flex-shrink-0 px-3 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setNewKeyValue(null); setShowCreateForm(false); setNewKeyName(''); }}
              className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create new key */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create API Key
          </button>
        ) : !newKeyValue && (
          <div className="mb-6 bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-warm-700 dark:text-warm-300 mb-1">Key name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. My Research App"
                  maxLength={50}
                  className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && createKey()}
                />
              </div>
              <button
                onClick={createKey}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 text-sm font-medium bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowCreateForm(false); setNewKeyName(''); }}
                className="px-3 py-2 text-sm text-warm-500 hover:text-warm-700 dark:text-warm-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing keys list */}
        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700">
              <svg className="w-10 h-10 text-warm-300 dark:text-warm-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-sm text-warm-500 dark:text-warm-400">No API keys yet</p>
              <p className="text-xs text-warm-400 dark:text-warm-500 mt-1">Create one to start using the API</p>
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-warm-900 dark:text-warm-100">{key.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      key.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {key.active ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <code className="text-xs text-warm-500 dark:text-warm-400 font-mono">{key.prefix}</code>
                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-warm-400 dark:text-warm-500">
                    <span>{key.requests.toLocaleString()} requests</span>
                    <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    {key.lastUsed && <span>Last used {new Date(key.lastUsed).toLocaleDateString()}</span>}
                  </div>
                </div>
                {key.active && (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="ml-3 text-xs text-red-500 hover:text-red-700 dark:text-red-400 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
