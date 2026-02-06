'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Collection {
  id: string;
  name: string;
  color: string;
  bookmarkCount: number;
}

interface BookmarkButtonProps {
  translationId: string | null | undefined;
}

export default function BookmarkButton({ translationId }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saved, setSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const fetchCollections = () => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((data) => setCollections(data.collections || []))
      .catch(() => {});
  };

  const handleOpen = () => {
    if (!session?.user || !translationId) return;
    setOpen(true);
    fetchCollections();
  };

  const addToCollection = async (collectionId: string) => {
    if (!translationId) return;
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId, translationId }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    }
  };

  const createAndAdd = async () => {
    if (!newName.trim() || !translationId) return;
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (data.collection) {
      await addToCollection(data.collection.id);
      setNewName('');
      setCreating(false);
    }
  };

  if (!translationId || !session?.user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="text-xs text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-cream-100 dark:hover:bg-warm-700 transition-colors"
        title="Save to collection"
      >
        <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saved ? 'Saved!' : 'Save'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-2 border-b border-cream-200 dark:border-warm-700">
            <p className="text-xs font-medium text-warm-700 dark:text-warm-300">Save to collection</p>
          </div>

          {collections.length > 0 && (
            <div className="max-h-40 overflow-y-auto">
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addToCollection(c.id)}
                  className="w-full text-left px-3 py-2 text-xs text-warm-700 dark:text-warm-300 hover:bg-cream-50 dark:hover:bg-warm-700 flex items-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate flex-1">{c.name}</span>
                  <span className="text-warm-400 dark:text-warm-500 text-[10px]">{c.bookmarkCount}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-cream-200 dark:border-warm-700 p-2">
            {creating ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  maxLength={60}
                  className="flex-1 text-xs px-2 py-1.5 bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-1 focus:ring-terracotta-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && createAndAdd()}
                  autoFocus
                />
                <button
                  onClick={createAndAdd}
                  disabled={!newName.trim()}
                  className="text-xs px-2 py-1.5 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-2 py-1.5 text-xs text-terracotta-500 hover:text-terracotta-600 font-medium flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
