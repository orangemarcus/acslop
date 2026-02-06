'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CommentData {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null; profileSlug: string | null };
}

interface CommentSectionProps {
  reportId: string;
}

export default function CommentSection({ reportId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUserId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    fetch(`/api/comments?reportId=${reportId}`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  const submitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, text: newComment.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const deleteComment = async (id: string) => {
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-soft overflow-hidden">
      <div className="px-5 py-4 border-b border-cream-200 dark:border-warm-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="p-5 text-center text-sm text-warm-400">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="p-5 text-center text-sm text-warm-400 dark:text-warm-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="divide-y divide-cream-100 dark:divide-warm-750">
          {comments.map((c) => (
            <div key={c.id} className="px-5 py-3 flex gap-3">
              {c.user.image ? (
                <img src={c.user.image} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-terracotta-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {(c.user.name || '?')[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {c.user.profileSlug ? (
                    <a href={`/profile/${c.user.profileSlug}`} className="text-xs font-medium text-warm-800 dark:text-warm-200 hover:text-terracotta-500">
                      {c.user.name || 'Anonymous'}
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-warm-800 dark:text-warm-200">{c.user.name || 'Anonymous'}</span>
                  )}
                  <span className="text-[10px] text-warm-400 dark:text-warm-500">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {currentUserId === c.user.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-[10px] text-warm-300 hover:text-red-500 dark:text-warm-600 dark:hover:text-red-400 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      {session?.user ? (
        <div className="px-5 py-3 border-t border-cream-200 dark:border-warm-700">
          <div className="flex items-start gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              rows={2}
              className="flex-1 px-3 py-2 text-sm bg-cream-50 dark:bg-warm-750 border border-cream-300 dark:border-warm-600 rounded-lg text-warm-900 dark:text-warm-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 resize-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) submitComment(); }}
            />
            <button
              onClick={submitComment}
              disabled={submitting || !newComment.trim()}
              className="px-3 py-2 text-sm font-medium bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 border-t border-cream-200 dark:border-warm-700 text-center">
          <a href="/auth/signin" className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium">
            Sign in to comment
          </a>
        </div>
      )}
    </div>
  );
}
