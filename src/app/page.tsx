'use client';

import { useState, useEffect } from 'react';
import TextInput from '@/components/TextInput';
import ImageUpload from '@/components/ImageUpload';
import LevelSelector from '@/components/LevelSelector';
import ResultsPanel from '@/components/ResultsPanel';
import { TranslateResponse, ComplexityLevel } from '@/types';

type View = 'input' | 'results';

export default function Home() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [level, setLevel] = useState<ComplexityLevel>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [view, setView] = useState<View>('input');
  const [darkMode, setDarkMode] = useState(false);

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

  const handleTranslate = async () => {
    if (!text && !image) {
      setError('Please enter some text or upload an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text || undefined,
          image: image || undefined,
          level,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const data: TranslateResponse = await response.json();
      setResult(data);
      setView('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setImage(null);
    setResult(null);
    setError(null);
    setView('input');
  };

  const handleRetranslate = async (newLevel: ComplexityLevel) => {
    setLevel(newLevel);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text || undefined,
          image: image || undefined,
          level: newLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const data: TranslateResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
              <div className="flex items-center gap-1 bg-cream-200 dark:bg-warm-700 rounded-lg p-1">
                <button
                  onClick={() => setView('input')}
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

            <div className="flex items-center gap-2">
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
                  className="text-sm text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {view === 'input' ? (
          <div className="space-y-8">
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
                <ImageUpload onImageSelect={setImage} disabled={loading} />
              </div>

              {/* Level selector */}
              <div className="mb-6">
                <LevelSelector level={level} onChange={setLevel} disabled={loading} />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleTranslate}
                  disabled={loading || (!text && !image)}
                  className="px-6 py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:bg-cream-300 dark:disabled:bg-warm-700 disabled:text-cream-400 dark:disabled:text-warm-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-soft"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Translate'
                  )}
                </button>
              </div>
            </div>

            {/* Examples */}
            <div>
              <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 px-1">Try an example</h3>
              <div className="space-y-2.5">
                {[
                  {
                    label: 'Sociology',
                    text: "The dialectical interplay between structure and agency manifests in the habituated practices of social actors, whose dispositional tendencies are simultaneously constituted by and constitutive of the field-specific logics that govern symbolic capital accumulation.",
                  },
                  {
                    label: 'Business',
                    text: "Leveraging synergistic cross-functional alignments, we can operationalize a paradigm shift toward customer-centric value propositions that drive sustainable competitive advantage through iterative optimization of touchpoint experiences.",
                  },
                  {
                    label: 'Philosophy',
                    text: "The epistemological ramifications of post-structuralist deconstruction necessitate a fundamental reconceptualization of the ontological status of textual meaning, whereby the signifier-signified relationship is revealed as inherently unstable and contingent upon the differance that perpetually defers presence.",
                  },
                ].map((example) => (
                  <button
                    key={example.label}
                    onClick={() => setText(example.text)}
                    className="w-full text-left p-4 bg-white dark:bg-warm-800 hover:bg-cream-50 dark:hover:bg-warm-700 border border-cream-300 dark:border-warm-700 hover:border-cream-400 dark:hover:border-warm-600 rounded-xl text-sm text-warm-700 dark:text-warm-300 shadow-soft"
                    disabled={loading}
                  >
                    <span className="text-xs font-semibold text-terracotta-500 uppercase tracking-wider">{example.label}</span>
                    <p className="mt-1 text-warm-600 dark:text-warm-400 line-clamp-2">&ldquo;{example.text.slice(0, 120)}...&rdquo;</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Level selector bar on results page */}
            <div className="bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700 p-4 shadow-soft flex items-center justify-between">
              <LevelSelector level={level} onChange={handleRetranslate} disabled={loading} compact />
              {loading && (
                <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Re-translating...
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {result && <ResultsPanel result={result} />}
          </div>
        )}
      </main>
    </div>
  );
}
