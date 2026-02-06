'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TranslateResponse } from '@/types';
import { getSlopLabel, getSlopColor } from '@/lib/slopCalculator';
import SlopGauge from '@/components/SlopGauge';
import HallucinationPanel from '@/components/HallucinationPanel';

interface SharedReport {
  shareId: string;
  title: string | null;
  views: number;
  createdAt: string;
  author: string;
  translation: {
    inputText: string;
    level: number;
    slopScore: number;
    result: TranslateResponse;
    createdAt: string;
  };
}

export default function SharedReportPage() {
  const params = useParams();
  const shareId = params.id as string;
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    fetch(`/api/share?id=${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Report not found');
        return r.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-warm-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-warm-500">
          <div className="w-5 h-5 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
          Loading report...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-warm-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-cream-200 dark:bg-warm-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-serif text-warm-900 dark:text-warm-100">Report Not Found</h1>
          <p className="text-sm text-warm-600 dark:text-warm-400">This report may have been removed or the link is invalid.</p>
          <Link href="/" className="inline-block text-sm text-terracotta-500 hover:text-terracotta-600 font-medium mt-2">
            Try the translator yourself
          </Link>
        </div>
      </div>
    );
  }

  const result = report.translation.result;
  const score = report.translation.slopScore;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-cream-300 dark:border-warm-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-900 dark:text-warm-100">Slop Report</h1>
                <p className="text-xs text-warm-600 dark:text-warm-400">Shared by {report.author}</p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium px-3 py-1.5 rounded-lg hover:bg-cream-200 dark:hover:bg-warm-700"
            >
              Try it yourself
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Score Hero */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 sm:p-8 shadow-soft text-center">
          {report.title && (
            <h2 className="text-lg font-serif text-warm-900 dark:text-warm-100 mb-4">{report.title}</h2>
          )}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: getSlopColor(score) }}
            >
              {score}
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{getSlopLabel(score)}</p>
              <p className="text-sm text-warm-600 dark:text-warm-400">Slop Index Score</p>
            </div>
          </div>
          <p className="text-xs text-warm-400 dark:text-warm-500">
            {report.views} view{report.views !== 1 ? 's' : ''} &middot; Shared {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Core Claim */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
          <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-terracotta-500" />
            Core Claim
          </h3>
          <p className="text-warm-800 dark:text-warm-200 text-sm leading-relaxed">{result.coreClaim}</p>
        </div>

        {/* Text comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta-500" />
              Original Text
            </h3>
            <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed font-serif italic">
              {result.original}
            </p>
          </div>
          <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
            <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Plain English
            </h3>
            <p className="text-warm-700 dark:text-warm-300 text-sm leading-relaxed">
              {result.translated}
            </p>
          </div>
        </div>

        {/* Slop Gauge + Hallucinations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SlopGauge slopIndex={result.slopIndex} />
          <HallucinationPanel hallucinations={result.hallucinations} />
        </div>

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-sm text-warm-600 dark:text-warm-400 mb-3">
            Want to check your own papers for academic slop?
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 shadow-soft"
          >
            Try the Academic Translator
          </Link>
        </div>
      </main>
    </div>
  );
}
