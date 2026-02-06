'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSlopColor, getSlopLabel } from '@/lib/slopCalculator';

interface Collection {
  id: string;
  name: string;
  color: string;
  bookmarkCount: number;
  createdAt: string;
}

interface BookmarkItem {
  id: string;
  note: string | null;
  createdAt: string;
  translation: {
    id: string;
    inputText: string;
    slopScore: number;
    level: number;
    createdAt: string;
  };
}

const COLORS = ['#C96442', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

export default function CollectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/collections');
      return;
    }
    if (session?.user) fetchCollections();
  }, [session, status, router]);

  const fetchCollections = () => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((data) => {
        setCollections(data.collections || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const selectCollection = (id: string, name: string) => {
    setSelectedId(id);
    setSelectedName(name);
    fetch(`/api/bookmarks?collectionId=${id}`)
      .then((r) => r.json())
      .then((data) => setBookmarks(data.bookmarks || []))
      .catch(() => {});
  };

  const createCollection = async () => {
    if (!newName.trim()) return;
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setNewName('');
    setCreating(false);
    fetchCollections();
  };

  const deleteCollection = async (id: string) => {
    if (!confirm('Delete this collection and all its bookmarks?')) return;
    await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
    if (selectedId === id) {
      setSelectedId(null);
      setBookmarks([]);
    }
    fetchCollections();
  };

  const removeBookmark = async (bookmarkCollectionId: string, translationId: string) => {
    await fetch(`/api/bookmarks?collectionId=${bookmarkCollectionId}&translationId=${translationId}`, {
      method: 'DELETE',
    });
    setBookmarks((prev) => prev.filter((b) => b.translation.id !== translationId));
    fetchCollections();
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
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Collections</h1>
            </div>
            <p className="text-warm-600 dark:text-warm-400 text-sm">Organize your translations into collections</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Create form */}
        {creating && (
          <div className="mb-6 bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-warm-700 dark:text-warm-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. ML Papers"
                  maxLength={60}
                  className="w-full px-3 py-2 text-sm bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && createCollection()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-700 dark:text-warm-300 mb-1">Color</label>
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-warm-800 dark:border-warm-200' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button onClick={createCollection} disabled={!newName.trim()} className="px-4 py-2 text-sm font-medium bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50">
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewName(''); }} className="px-3 py-2 text-sm text-warm-500">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collections list */}
          <div className="space-y-2">
            {collections.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700">
                <svg className="w-10 h-10 text-warm-300 dark:text-warm-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <p className="text-sm text-warm-500 dark:text-warm-400">No collections yet</p>
              </div>
            ) : (
              collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCollection(c.id, c.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    selectedId === c.id
                      ? 'bg-white dark:bg-warm-800 border-terracotta-400 dark:border-terracotta-600 shadow-soft'
                      : 'bg-white dark:bg-warm-800 border-cream-300 dark:border-warm-700 hover:border-cream-400 dark:hover:border-warm-600'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate">{c.name}</p>
                    <p className="text-[11px] text-warm-400 dark:text-warm-500">
                      {c.bookmarkCount} item{c.bookmarkCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCollection(c.id); }}
                    className="text-warm-300 hover:text-red-500 dark:text-warm-600 dark:hover:text-red-400 flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              ))
            )}
          </div>

          {/* Bookmarks panel */}
          <div className="lg:col-span-2">
            {selectedId ? (
              <div className="bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700">
                  <h2 className="text-sm font-semibold text-warm-800 dark:text-warm-200">{selectedName}</h2>
                  <p className="text-[11px] text-warm-400 dark:text-warm-500">{bookmarks.length} saved translation{bookmarks.length !== 1 ? 's' : ''}</p>
                </div>
                {bookmarks.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-warm-400 dark:text-warm-500">
                    No bookmarks in this collection yet. Use the &quot;Save&quot; button on translations to add them.
                  </div>
                ) : (
                  <div className="divide-y divide-cream-200 dark:divide-warm-700">
                    {bookmarks.map((b) => (
                      <div key={b.id} className="px-5 py-3 flex items-center gap-4 hover:bg-cream-50 dark:hover:bg-warm-750">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: getSlopColor(b.translation.slopScore) }}
                        >
                          {b.translation.slopScore}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-warm-800 dark:text-warm-200 truncate">{b.translation.inputText}</p>
                          <p className="text-xs text-warm-500 dark:text-warm-400 mt-0.5">
                            Level {b.translation.level} &middot; {getSlopLabel(b.translation.slopScore)} &middot; {new Date(b.translation.createdAt).toLocaleDateString()}
                          </p>
                          {b.note && <p className="text-[11px] text-warm-400 dark:text-warm-500 mt-0.5 italic">{b.note}</p>}
                        </div>
                        <button
                          onClick={() => removeBookmark(selectedId!, b.translation.id)}
                          className="text-warm-300 hover:text-red-500 dark:text-warm-600 dark:hover:text-red-400 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700">
                <p className="text-sm text-warm-400 dark:text-warm-500">Select a collection to view its bookmarks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
