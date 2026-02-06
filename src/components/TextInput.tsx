'use client';

import { useState, useEffect, useCallback } from 'react';

interface TextInputProps {
  onTextChange: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

const MAX_CHARS = 5000;
const WARN_THRESHOLD = 0.85; // 85%

// Simple URL pattern for detection
const URL_PATTERN = /^https?:\/\/[^\s]+$/;

export default function TextInput({ onTextChange, disabled, initialValue }: TextInputProps) {
  const [text, setText] = useState(initialValue || '');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlTitle, setUrlTitle] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
      setTruncated(false);
      setUrlTitle(null);
      setUrlError(null);
    }
  }, [initialValue]);

  const applyText = useCallback((newText: string) => {
    if (newText.length > MAX_CHARS) {
      // Auto-trim at sentence boundary near the limit
      const trimTarget = MAX_CHARS;
      let trimPoint = newText.lastIndexOf('. ', trimTarget);
      if (trimPoint < trimTarget * 0.7) {
        trimPoint = newText.lastIndexOf(' ', trimTarget);
      }
      if (trimPoint < trimTarget * 0.5) {
        trimPoint = trimTarget;
      }
      const trimmed = newText.slice(0, trimPoint + 1);
      setText(trimmed);
      onTextChange(trimmed);
      setTruncated(true);
    } else {
      setText(newText);
      onTextChange(newText);
      setTruncated(false);
    }
  }, [onTextChange]);

  const fetchUrl = useCallback(async (url: string) => {
    setFetchingUrl(true);
    setUrlError(null);
    setUrlTitle(null);

    try {
      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUrlError(data.error || 'Failed to fetch URL');
        return;
      }

      if (data.title) setUrlTitle(data.title);
      applyText(data.text);
    } catch {
      setUrlError('Failed to fetch URL content');
    } finally {
      setFetchingUrl(false);
    }
  }, [applyText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setUrlError(null);
    setUrlTitle(null);

    if (newText.length <= MAX_CHARS) {
      setText(newText);
      onTextChange(newText);
      setTruncated(false);
    } else {
      applyText(newText);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text').trim();

    // Detect URL paste
    if (URL_PATTERN.test(pasted) && pasted.length < 2000) {
      e.preventDefault();
      setText(pasted);
      onTextChange(pasted);
      fetchUrl(pasted);
    }
  };

  const handleClear = () => {
    setText('');
    onTextChange('');
    setUrlError(null);
    setUrlTitle(null);
    setTruncated(false);
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CHARS * WARN_THRESHOLD;
  const charPercent = Math.min(100, (charCount / MAX_CHARS) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="academic-text" className="text-sm font-medium text-warm-800 dark:text-warm-200">
          Paste academic text or URL
        </label>
        {text && (
          <button
            onClick={handleClear}
            className="text-xs text-warm-600 hover:text-warm-900 dark:text-warm-400 dark:hover:text-warm-200"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <textarea
          id="academic-text"
          value={text}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={disabled || fetchingUrl}
          placeholder="Paste that dense, jargon-filled academic prose here — or paste a URL to extract text from a webpage..."
          className="w-full h-52 p-4 bg-cream-50 dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed text-warm-900 dark:text-warm-100 placeholder-cream-400 dark:placeholder-warm-500 text-sm leading-relaxed"
        />

        {/* URL fetching overlay */}
        {fetchingUrl && (
          <div className="absolute inset-0 bg-cream-50/80 dark:bg-warm-800/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-warm-600 dark:text-warm-400">
              <svg className="w-5 h-5 animate-spin text-terracotta-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching page content...
            </div>
          </div>
        )}
      </div>

      {/* URL success / error messages */}
      {urlTitle && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
          <span className="truncate">Extracted from: {urlTitle}</span>
        </div>
      )}

      {urlError && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {urlError}
        </div>
      )}

      {/* Truncation warning */}
      {truncated && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Text was auto-trimmed to {MAX_CHARS.toLocaleString()} characters at the nearest sentence boundary.
        </div>
      )}

      {/* Stats bar with progress indicator */}
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-warm-600 dark:text-warm-400">
            {text.split(/\s+/).filter(w => w).length} words
          </span>
          <span className={
            charCount >= MAX_CHARS
              ? 'text-red-500 font-semibold'
              : isNearLimit
                ? 'text-terracotta-500 font-medium'
                : 'text-warm-600 dark:text-warm-400'
          }>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>

        {/* Character limit progress bar - only shows when near limit */}
        {isNearLimit && (
          <div className="h-1 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                charCount >= MAX_CHARS ? 'bg-red-500' : 'bg-terracotta-500'
              }`}
              style={{ width: `${charPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
