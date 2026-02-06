'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 text-warm-300 dark:text-warm-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PricingContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [successBanner, setSuccessBanner] = useState(false);
  const [cancelBanner, setCancelBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessBanner(true);
      setUserPlan('pro');
    }
    if (searchParams.get('canceled') === 'true') {
      setCancelBanner(true);
    }
  }, [searchParams]);

  // Fetch actual plan from session
  useEffect(() => {
    if ((session?.user as { plan?: string })?.plan) {
      setUserPlan((session!.user as { plan: string }).plan);
    }
  }, [session]);

  const handleUpgrade = async () => {
    if (!session?.user) {
      window.location.href = '/auth/signin?callbackUrl=/pricing';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch {
      alert('Failed to connect to payment service');
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
        setLoading(false);
      }
    } catch {
      alert('Failed to connect to billing service');
      setLoading(false);
    }
  };

  const isPro = userPlan === 'pro';

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-warm-800/80 backdrop-blur-sm border-b border-cream-300 dark:border-warm-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-900 dark:text-warm-100">Pricing</h1>
                <p className="text-xs text-warm-600 dark:text-warm-400">Choose your plan</p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm text-terracotta-500 hover:text-terracotta-600 font-medium flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Translator
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Success/cancel banners */}
        {successBanner && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Welcome to Pro! Your account has been upgraded. Enjoy 200 translations/month and all premium features.
          </div>
        )}
        {cancelBanner && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
            Checkout was cancelled. No charges were made. You can upgrade anytime.
          </div>
        )}

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-3xl font-serif text-warm-900 dark:text-warm-100 mb-2">
            Simple, transparent pricing
          </h2>
          <p className="text-warm-600 dark:text-warm-400">
            Start for free, upgrade when you need more power
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={`bg-white dark:bg-warm-800 rounded-2xl border p-6 shadow-soft ${
            !isPro ? 'border-terracotta-400 dark:border-terracotta-600 ring-2 ring-terracotta-400/20' : 'border-cream-300 dark:border-warm-700'
          }`}>
            {!isPro && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 px-2 py-0.5 rounded-full mb-3">
                Current plan
              </span>
            )}
            <h3 className="text-xl font-bold text-warm-900 dark:text-warm-100">Free</h3>
            <div className="mt-2 mb-6">
              <span className="text-4xl font-bold text-warm-900 dark:text-warm-100">$0</span>
              <span className="text-warm-500 dark:text-warm-400 text-sm">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                { has: true, text: '25 translations/month' },
                { has: true, text: 'Up to 5,000 characters' },
                { has: true, text: 'Image upload support' },
                { has: true, text: 'Slop Index scoring' },
                { has: true, text: 'Hallucination detection' },
                { has: true, text: 'Export & share reports' },
                { has: true, text: 'Personal dashboard' },
                { has: false, text: 'Bulk paper analysis' },
                { has: false, text: 'Priority processing' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-warm-700 dark:text-warm-300">
                  {item.has ? <CheckIcon /> : <XIcon />}
                  <span className={!item.has ? 'text-warm-400 dark:text-warm-500' : ''}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            {!isPro && status !== 'loading' && !session?.user && (
              <Link
                href="/auth/signin"
                className="block w-full text-center py-2.5 border border-cream-300 dark:border-warm-600 text-warm-700 dark:text-warm-300 font-medium rounded-xl hover:bg-cream-50 dark:hover:bg-warm-750 text-sm"
              >
                Sign up free
              </Link>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`bg-white dark:bg-warm-800 rounded-2xl border p-6 shadow-soft relative ${
            isPro ? 'border-terracotta-400 dark:border-terracotta-600 ring-2 ring-terracotta-400/20' : 'border-cream-300 dark:border-warm-700'
          }`}>
            {isPro && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-terracotta-500 bg-terracotta-50 dark:bg-terracotta-900/30 px-2 py-0.5 rounded-full mb-3">
                Current plan
              </span>
            )}
            {!isPro && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mb-3">
                Recommended
              </span>
            )}
            <h3 className="text-xl font-bold text-warm-900 dark:text-warm-100 flex items-center gap-2">
              Pro
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </h3>
            <div className="mt-2 mb-6">
              <span className="text-4xl font-bold text-warm-900 dark:text-warm-100">$9</span>
              <span className="text-warm-500 dark:text-warm-400 text-sm">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                { text: '200 translations/month', highlight: true },
                { text: 'Up to 15,000 characters', highlight: true },
                { text: 'Image upload support' },
                { text: 'Slop Index scoring' },
                { text: 'Hallucination detection' },
                { text: 'Export & share reports' },
                { text: 'Personal dashboard' },
                { text: 'Bulk paper analysis', highlight: true },
                { text: 'Priority processing', highlight: true },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-warm-700 dark:text-warm-300">
                  <CheckIcon />
                  <span className={item.highlight ? 'font-medium' : ''}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-2.5 border border-cream-300 dark:border-warm-600 text-warm-700 dark:text-warm-300 font-medium rounded-xl hover:bg-cream-50 dark:hover:bg-warm-750 text-sm disabled:opacity-50"
              >
                {loading ? 'Opening...' : 'Manage subscription'}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 text-sm shadow-soft disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Upgrade to Pro'
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft">
          <h3 className="text-lg font-serif text-warm-900 dark:text-warm-100 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, cancel your Pro subscription anytime. You\'ll keep Pro access until the end of your billing period.',
              },
              {
                q: 'What happens when I hit my translation limit?',
                a: 'Your limit resets at the start of each month. Free users get 25/month, Pro gets 200/month. You can upgrade at any time to get more.',
              },
              {
                q: 'Is my data private?',
                a: 'Absolutely. Your translations are only visible to you. Shared reports are only accessible via their unique link.',
              },
              {
                q: 'What is bulk analysis?',
                a: 'Pro users can paste an entire paper and have each section analyzed individually, with a combined clarity report across all sections.',
              },
            ].map((faq, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold text-warm-800 dark:text-warm-200">{faq.q}</h4>
                <p className="text-sm text-warm-600 dark:text-warm-400 mt-0.5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-100 dark:bg-warm-900 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
