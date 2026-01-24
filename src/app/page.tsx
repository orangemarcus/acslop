'use client';

import { useState } from 'react';
import TextInput from '@/components/TextInput';
import ImageUpload from '@/components/ImageUpload';
import ResultsPanel from '@/components/ResultsPanel';
import { TranslateResponse } from '@/types';

export default function Home() {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateResponse | null>(null);

  const handleTranslate = async () => {
    if (!text && !image) {
      setError('Please enter some text or upload an image');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text || undefined,
          image: image || undefined,
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

  const handleClear = () => {
    setText('');
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-cream-300 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-900">Academic Translator</h1>
                <p className="text-xs text-warm-600">Dense papers to plain English</p>
              </div>
            </div>
            {result && (
              <button
                onClick={handleClear}
                className="text-sm text-warm-600 hover:text-warm-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cream-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New translation
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {!result ? (
          <div className="space-y-8">
            {/* Welcome */}
            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-2xl font-serif text-warm-900 mb-2">What would you like to understand?</h2>
              <p className="text-sm text-warm-600">
                Paste academic text or upload an image. I&apos;ll translate it so a first-year student can follow along, and check for hallucinated citations.
              </p>
            </div>

            {/* Input card */}
            <div className="bg-white rounded-2xl border border-cream-300 p-6 shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput onTextChange={setText} disabled={loading} />
                <ImageUpload onImageSelect={setImage} disabled={loading} />
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleTranslate}
                  disabled={loading || (!text && !image)}
                  className="px-6 py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:bg-cream-300 disabled:text-cream-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-soft"
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
              <h3 className="text-xs font-semibold text-warm-600 uppercase tracking-wider mb-3 px-1">Try an example</h3>
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
                    className="w-full text-left p-4 bg-white hover:bg-cream-50 border border-cream-300 hover:border-cream-400 rounded-xl text-sm text-warm-700 shadow-soft"
                    disabled={loading}
                  >
                    <span className="text-xs font-semibold text-terracotta-500 uppercase tracking-wider">{example.label}</span>
                    <p className="mt-1 text-warm-600 line-clamp-2">&ldquo;{example.text.slice(0, 120)}...&rdquo;</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ResultsPanel result={result} />
        )}
      </main>
    </div>
  );
}
