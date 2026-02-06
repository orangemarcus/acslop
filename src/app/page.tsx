'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import TextInput from '@/components/TextInput';
import ImageUpload from '@/components/ImageUpload';
import LevelSelector from '@/components/LevelSelector';
import ResultsPanel from '@/components/ResultsPanel';
import HistoryDrawer from '@/components/HistoryDrawer';
import StreamingPreview from '@/components/StreamingPreview';
import ExampleBrowser from '@/components/ExampleBrowser';
import OnboardingTour from '@/components/OnboardingTour';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import BulkAnalysis from '@/components/BulkAnalysis';
import UserMenu from '@/components/UserMenu';
import { useSession } from 'next-auth/react';
import { TranslateResponse, ComplexityLevel, HistoryEntry } from '@/types';
import { getHistory, addHistoryEntry } from '@/lib/history';

type View = 'input' | 'results' | 'bulk';

const INPUT_STORAGE_KEY = 'acslop_draft';

function parseSSE(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = chunk.split('\n\n').filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n');
    let event = '';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data = line.slice(6);
    }
    if (event && data) events.push({ event, data });
  }
  return events;
}

export default function Home() {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>('image/png');
  const [level, setLevel] = useState<ComplexityLevel>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [view, setView] = useState<View>('input');
  const [darkMode, setDarkMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [streamStatus, setStreamStatus] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; limit: number; resetsIn: string } | null>(null);
  const [lastTranslationId, setLastTranslationId] = useState<string | null>(null);

  // '?' key to open keyboard shortcuts help
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  // Restore draft input from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(INPUT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.text) setText(parsed.text);
        if (parsed.level) setLevel(parsed.level);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist draft input to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify({ text, level }));
    } catch {
      // ignore
    }
  }, [text, level]);

  // Initialize dark mode from system preference or localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Track elapsed time during loading
  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  // Ctrl+Enter / Cmd+Enter keyboard shortcut to translate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading && (text || image) && view === 'input') {
        e.preventDefault();
        handleTranslate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [text, image, loading, view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save translation to cloud for authenticated users
  const saveToCloud = useCallback(async (inputText: string, lvl: number, translationResult: TranslateResponse) => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText, level: lvl, result: translationResult }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) setLastTranslationId(data.id);
      }
    } catch {
      // Silent fail — local history is the fallback
    }
  }, [session]);

  const streamTranslation = async (
    requestBody: Record<string, unknown>,
    onComplete: (data: TranslateResponse) => void
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setStreamStatus('Connecting...');

    try {
      const response = await fetch('/api/translate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        const events = parseSSE(text);
        const errorEvent = events.find(e => e.event === 'error');
        if (errorEvent) {
          throw new Error(JSON.parse(errorEvent.data).error);
        }
        throw new Error('Translation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lastDoubleNewline = buffer.lastIndexOf('\n\n');
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSE(complete);
        for (const evt of events) {
          try {
            const data = JSON.parse(evt.data);
            switch (evt.event) {
              case 'status':
                setStreamStatus(data.message);
                break;
              case 'quota':
                setQuotaInfo(data);
                break;
              case 'done':
                onComplete(data as TranslateResponse);
                return;
              case 'error':
                throw new Error(data.error || 'Translation failed');
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Translation failed' && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }

      if (buffer.trim()) {
        const events = parseSSE(buffer);
        for (const evt of events) {
          const data = JSON.parse(evt.data);
          if (evt.event === 'done') {
            onComplete(data as TranslateResponse);
            return;
          }
          if (evt.event === 'error') {
            throw new Error(data.error || 'Translation failed');
          }
        }
      }

      throw new Error('Stream ended without result');
    } catch (err) {
      if (controller.signal.aborted) {
        setStreamStatus('');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
      setStreamStatus('');
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  const handleTranslate = async () => {
    if (!text && !image) {
      setError('Please enter some text or upload an image');
      return;
    }

    await streamTranslation(
      {
        text: text || undefined,
        image: image || undefined,
        imageMediaType: image ? imageMediaType : undefined,
        level,
      },
      (data) => {
        setResult(data);
        setView('results');
        const inputText = text || data.original;
        addHistoryEntry(inputText, level, data);
        refreshHistory();
        saveToCloud(inputText, level, data);
      }
    );
  };

  const handleClear = () => {
    setText('');
    setImage(null);
    setResult(null);
    setError(null);
    setLastTranslationId(null);
    setView('input');
  };

  const handleRetranslate = async (newLevel: ComplexityLevel) => {
    setLevel(newLevel);

    await streamTranslation(
      {
        text: text || undefined,
        image: image || undefined,
        imageMediaType: image ? imageMediaType : undefined,
        level: newLevel,
      },
      (data) => {
        setResult(data);
        const inputText = text || data.original;
        addHistoryEntry(inputText, newLevel, data);
        refreshHistory();
        saveToCloud(inputText, newLevel, data);
      }
    );
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setText(entry.inputText);
    setLevel(entry.level);
    setResult(entry.result);
    setImage(null);
    setError(null);
    setView('results');
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-cream-300 dark:border-warm-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-900 dark:text-warm-100">Academic Translator</h1>
                <p className="text-xs text-warm-600 dark:text-warm-400">Dense papers to plain English</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            {result && (
              <div className="hidden sm:flex items-center gap-1 bg-cream-200 dark:bg-warm-700 rounded-lg p-1">
                <button
                  onClick={() => setView('input')}
                  aria-pressed={view === 'input'}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    view === 'input'
                      ? 'bg-white dark:bg-warm-600 text-warm-900 dark:text-warm-100 shadow-soft'
                      : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200'
                  }`}
                >
                  Input
                </button>
                <button
                  onClick={() => setView('results')}
                  aria-pressed={view === 'results'}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    view === 'results'
                      ? 'bg-white dark:bg-warm-600 text-warm-900 dark:text-warm-100 shadow-soft'
                      : 'text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200'
                  }`}
                >
                  Results
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {/* History button */}
              <button
                onClick={() => setHistoryOpen(true)}
                className="p-2 rounded-lg text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-700 relative"
                aria-label="Translation history"
                title="Translation history"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {history.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-terracotta-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {history.length > 9 ? '9+' : history.length}
                  </span>
                )}
              </button>

              {/* Keyboard shortcuts */}
              <button
                onClick={() => setShortcutsOpen(true)}
                className="hidden sm:flex p-2 rounded-lg text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-700"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14h2m-2-4h2m4 4h2m-2-4h2m4 4h2m-2-4h2M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-warm-600 dark:text-warm-400 hover:bg-cream-200 dark:hover:bg-warm-700"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {result && (
                <button
                  onClick={handleClear}
                  aria-label="Start new translation"
                  className="text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New
                </button>
              )}

              {/* User menu / Sign in */}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10" aria-live="polite">
        {loading && streamStatus ? (
          <StreamingPreview status={streamStatus} onCancel={handleCancel} />
        ) : view === 'input' ? (
          <div key="input" className="space-y-8 view-enter">
            {/* Welcome */}
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-serif text-warm-900 dark:text-warm-100 mb-2">What would you like to understand?</h2>
              <p className="text-sm text-warm-600 dark:text-warm-400">
                Paste academic text or upload an image. Choose your detail level, and I&apos;ll translate it and check for hallucinated citations.
              </p>
            </div>

            {/* Input card */}
            <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <TextInput onTextChange={setText} disabled={loading} initialValue={text} />
                <div data-tour="image-upload">
                  <ImageUpload onImageSelect={(base64, mediaType) => { setImage(base64); if (mediaType) setImageMediaType(mediaType); }} disabled={loading} />
                </div>
              </div>

              {/* Level selector */}
              <div className="mb-6" data-tour="level-selector">
                <LevelSelector level={level} onChange={setLevel} disabled={loading} />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm flex items-center justify-between gap-3">
                  <span className="text-red-700 dark:text-red-400">{error}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleTranslate}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
                      aria-label="Dismiss error"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Quota indicator */}
              {quotaInfo && (
                <div className="mb-3 text-center">
                  <span className="text-[11px] text-warm-500 dark:text-warm-400">
                    {quotaInfo.used} / {quotaInfo.limit} translations used
                    {!session?.user && (
                      <> &mdash; <button onClick={() => { window.location.href = '/auth/signin'; }} className="text-terracotta-500 hover:text-terracotta-600 font-medium">Sign in</button> for 25/month</>
                    )}
                    {session?.user && (session.user as { plan?: string }).plan !== 'pro' && quotaInfo.used > quotaInfo.limit * 0.6 && (
                      <> &mdash; <a href="/pricing" className="text-terracotta-500 hover:text-terracotta-600 font-medium">Upgrade to Pro</a> for 200/month</>
                    )}
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center gap-3" data-tour="translate-btn">
                <button
                  onClick={handleTranslate}
                  disabled={loading || (!text && !image)}
                  className="px-6 py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:bg-cream-300 dark:disabled:bg-warm-700 disabled:text-cream-400 dark:disabled:text-warm-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-soft"
                >
                  Translate
                  <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-terracotta-600 rounded">Ctrl+Enter</kbd>
                </button>
                {(session?.user as { plan?: string })?.plan === 'pro' ? (
                  <button
                    onClick={() => setView('bulk')}
                    className="text-xs text-warm-500 dark:text-warm-400 hover:text-terracotta-500 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Analyze a full paper (bulk mode)
                  </button>
                ) : (
                  <a
                    href="/pricing"
                    className="text-xs text-warm-400 dark:text-warm-500 hover:text-terracotta-500 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bulk paper analysis
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Pro
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Examples */}
            <ExampleBrowser onSelect={setText} disabled={loading} />
          </div>
        ) : view === 'bulk' ? (
          <div key="bulk" className="view-enter">
            <BulkAnalysis level={level} onClose={() => setView('input')} />
          </div>
        ) : (
          <div key="results" className="space-y-4 view-enter">
            {/* Level selector bar on results page */}
            <div className="bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700 p-4 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
              <LevelSelector level={level} onChange={handleRetranslate} disabled={loading} compact />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm flex items-center justify-between gap-3">
                <span className="text-red-700 dark:text-red-400">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0"
                  aria-label="Dismiss error"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {result && (
              <ResultsPanel
                result={result}
                translationId={lastTranslationId}
                inputText={text}
                level={level}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-6 mt-4 border-t border-cream-200 dark:border-warm-800 no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-500 dark:text-warm-500">
          <p>
            Academic Slop Translator &mdash; Powered by Claude
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/leaderboard"
              className="hover:text-warm-700 dark:hover:text-warm-300"
            >
              Leaderboard
            </a>
            <a
              href="/docs/api"
              className="hover:text-warm-700 dark:hover:text-warm-300"
            >
              API
            </a>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="hover:text-warm-700 dark:hover:text-warm-300 hidden sm:inline"
            >
              Keyboard shortcuts
              <kbd className="ml-1 px-1 py-0.5 text-[9px] font-mono bg-cream-100 dark:bg-warm-700 border border-cream-300 dark:border-warm-600 rounded">?</kbd>
            </button>
            <span className="text-warm-400 dark:text-warm-600">v1.0</span>
          </div>
        </div>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history}
        onSelect={handleHistorySelect}
        onHistoryChange={refreshHistory}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Onboarding Tour (first visit only) */}
      {view === 'input' && !loading && <OnboardingTour />}
    </div>
  );
}
