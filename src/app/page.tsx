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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Academic Slop Translator
              </h1>
              <p className="text-sm text-gray-500">
                Turn pretentious academic prose into plain English
              </p>
            </div>
            {result && (
              <button
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!result ? (
          /* Input Section */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInput onTextChange={setText} disabled={loading} />
                <ImageUpload onImageSelect={setImage} disabled={loading} />
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Translate button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleTranslate}
                  disabled={loading || (!text && !image)}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Translating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Translate to Plain English
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sample inputs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Try these examples:</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setText("The dialectical interplay between structure and agency manifests in the habituated practices of social actors, whose dispositional tendencies are simultaneously constituted by and constitutive of the field-specific logics that govern symbolic capital accumulation.")}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  disabled={loading}
                >
                  <span className="font-medium text-gray-900">Sociology:</span> &ldquo;The dialectical interplay between structure and agency manifests in the habituated practices of social actors...&rdquo;
                </button>
                <button
                  onClick={() => setText("Leveraging synergistic cross-functional alignments, we can operationalize a paradigm shift toward customer-centric value propositions that drive sustainable competitive advantage through iterative optimization of touchpoint experiences.")}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  disabled={loading}
                >
                  <span className="font-medium text-gray-900">Business:</span> &ldquo;Leveraging synergistic cross-functional alignments, we can operationalize a paradigm shift...&rdquo;
                </button>
                <button
                  onClick={() => setText("The epistemological ramifications of post-structuralist deconstruction necessitate a fundamental reconceptualization of the ontological status of textual meaning, whereby the signifier-signified relationship is revealed as inherently unstable and contingent upon the differance that perpetually defers presence.")}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  disabled={loading}
                >
                  <span className="font-medium text-gray-900">Philosophy:</span> &ldquo;The epistemological ramifications of post-structuralist deconstruction necessitate...&rdquo;
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Section */
          <ResultsPanel result={result} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Powered by Claude AI. Fighting academic jargon one paragraph at a time.
        </div>
      </footer>
    </div>
  );
}
