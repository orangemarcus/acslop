'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ShareButtonProps {
  translationId: string | null;
  inputText: string;
  level: number;
  result: unknown;
}

export default function ShareButton({ translationId, inputText, level, result }: ShareButtonProps) {
  const { data: session } = useSession();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!session?.user) {
      setError('Sign in to share reports');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, ensure we have a translationId by saving if needed
      let tid = translationId;
      if (!tid) {
        const saveRes = await fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputText, level, result }),
        });
        if (!saveRes.ok) throw new Error('Failed to save translation');
        const saveData = await saveRes.json();
        tid = saveData.id;
      }

      // Create share link
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translationId: tid }),
      });

      if (!res.ok) throw new Error('Failed to create share link');
      const data = await res.json();

      const url = `${window.location.origin}/report/${data.shareId}`;
      setShareUrl(url);

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopy}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Link copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleShare}
        disabled={loading}
        className="text-xs text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-cream-100 dark:hover:bg-warm-700 transition-colors disabled:opacity-50"
        title={session?.user ? 'Share this report' : 'Sign in to share'}
      >
        {loading ? (
          <>
            <div className="w-3 h-3 border border-warm-400 border-t-transparent rounded-full animate-spin" />
            Sharing...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </>
        )}
      </button>
      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  );
}
