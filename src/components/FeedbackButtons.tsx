'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FeedbackButtonsProps {
  translationId: string | null | undefined;
}

export default function FeedbackButtons({ translationId }: FeedbackButtonsProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    if (!translationId || !session?.user) return;
    fetch(`/api/feedback?translationId=${translationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.feedback) setRating(data.feedback.rating);
      })
      .catch(() => {});
  }, [translationId, session]);

  const submitFeedback = async (newRating: number) => {
    if (!translationId || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translationId, rating: newRating }),
      });
      if (res.ok) {
        setRating(newRating);
        setShowToast(newRating === 2 ? 'Thanks for the feedback!' : 'Noted, we\'ll improve!');
        setTimeout(() => setShowToast(null), 2000);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (!translationId) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-warm-400 dark:text-warm-500">Rate this translation:</span>
      <button
        onClick={() => submitFeedback(2)}
        disabled={loading}
        className={`p-1.5 rounded-lg transition-all ${
          rating === 2
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'text-warm-400 dark:text-warm-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
        }`}
        title="Good translation"
      >
        <svg className="w-4 h-4" fill={rating === 2 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => submitFeedback(1)}
        disabled={loading}
        className={`p-1.5 rounded-lg transition-all ${
          rating === 1
            ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
            : 'text-warm-400 dark:text-warm-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        title="Needs improvement"
      >
        <svg className="w-4 h-4" fill={rating === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
      {showToast && (
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 animate-pulse">
          {showToast}
        </span>
      )}
    </div>
  );
}
