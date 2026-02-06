'use client';

import { useState } from 'react';

type Tab = 'quickstart' | 'reference' | 'errors';

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-cream-300 dark:border-warm-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-cream-100 dark:bg-warm-750 border-b border-cream-200 dark:border-warm-700">
        <span className="text-[10px] font-mono text-warm-500 dark:text-warm-400 uppercase">{language}</span>
        <button
          onClick={copy}
          className="text-[10px] text-warm-400 hover:text-warm-600 dark:text-warm-500 dark:hover:text-warm-300"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-white dark:bg-warm-800 text-xs leading-relaxed">
        <code className="text-warm-800 dark:text-warm-200 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  const [tab, setTab] = useState<Tab>('quickstart');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'quickstart', label: 'Quick Start' },
    { key: 'reference', label: 'API Reference' },
    { key: 'errors', label: 'Errors & Limits' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-warm-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <a href="/" className="text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">API Documentation</h1>
          </div>
          <p className="text-warm-600 dark:text-warm-400 text-sm">
            Integrate ACSLOP into your applications with our REST API.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-cream-200 dark:bg-warm-800 rounded-lg p-0.5 mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm rounded-md transition-all ${
                tab === t.key
                  ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-100 shadow-soft font-medium'
                  : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Quick Start */}
        {tab === 'quickstart' && (
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-3">1. Get an API Key</h2>
              <p className="text-sm text-warm-600 dark:text-warm-400 mb-3">
                Create an API key from your{' '}
                <a href="/settings/api" className="text-terracotta-500 hover:text-terracotta-600 font-medium">Settings page</a>.
                Keys are tied to your account and share your plan&apos;s quota.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-3">2. Make a Request</h2>
              <CodeBlock
                language="curl"
                code={`curl -X POST /api/v1/translate \\
  -H "Authorization: Bearer acslop_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "The epistemological ramifications of quantum decoherence necessitate a fundamental reconceptualization of observer-dependent measurement paradigms.",
    "level": 3
  }'`}
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-3">3. Parse the Response</h2>
              <CodeBlock
                language="json"
                code={`{
  "original": "The epistemological ramifications...",
  "translated": "What we can know about reality changes when we...",
  "slopIndex": {
    "score": 72,
    "breakdown": {
      "passiveVoice": 35,
      "nominalizations": 6,
      "hedgeWords": 3,
      "jargonDensity": 2.5,
      "sentenceLength": 28
    }
  },
  "coreClaim": "Quantum decoherence requires rethinking how observation affects measurement.",
  "mappings": [...],
  "hallucinations": [...],
  "_cached": false,
  "_quota": { "used": 12, "limit": 25 }
}`}
              />
            </section>

            <section>
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-3">SDK Examples</h2>
              <div className="space-y-4">
                <CodeBlock
                  language="python"
                  code={`import requests

response = requests.post(
    "https://your-domain.com/api/v1/translate",
    headers={"Authorization": "Bearer acslop_your_key"},
    json={"text": "Your academic text here", "level": 3}
)

data = response.json()
print(f"Slop Score: {data['slopIndex']['score']}/100")
print(f"Translation: {data['translated']}")`}
                />
                <CodeBlock
                  language="javascript"
                  code={`const response = await fetch('/api/v1/translate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer acslop_your_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Your academic text here',
    level: 3,
  }),
});

const data = await response.json();
console.log(\`Slop Score: \${data.slopIndex.score}/100\`);
console.log(\`Translation: \${data.translated}\`);`}
                />
              </div>
            </section>
          </div>
        )}

        {/* API Reference */}
        {tab === 'reference' && (
          <div className="space-y-8">
            <section className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md">POST</span>
                <code className="text-sm font-mono text-warm-800 dark:text-warm-200">/api/v1/translate</code>
              </div>
              <p className="text-sm text-warm-600 dark:text-warm-400 mb-4">
                Translate academic text into plain English and analyze its slop index.
              </p>

              <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-2">Headers</h3>
              <div className="bg-cream-50 dark:bg-warm-750 rounded-lg p-3 mb-4 text-xs font-mono space-y-1">
                <div><span className="text-terracotta-500">Authorization</span>: Bearer acslop_... <span className="text-warm-400">(required)</span></div>
                <div><span className="text-terracotta-500">Content-Type</span>: application/json</div>
              </div>

              <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mb-2">Request Body</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cream-200 dark:border-warm-700">
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Field</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Type</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Required</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-700 dark:text-warm-300">
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">text</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">Yes</td>
                      <td className="py-2 px-2">Academic text to translate (max 5,000 or 15,000 chars by plan)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-mono">level</td>
                      <td className="py-2 px-2">number</td>
                      <td className="py-2 px-2">No</td>
                      <td className="py-2 px-2">Complexity level 1-5 (default: 4). 1=very simple, 5=detailed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mt-4 mb-2">Response Fields</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cream-200 dark:border-warm-700">
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Field</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Type</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-700 dark:text-warm-300">
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">original</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">The input text</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">translated</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">Plain English translation</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">coreClaim</td>
                      <td className="py-2 px-2">string</td>
                      <td className="py-2 px-2">One-sentence core claim extracted</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">slopIndex</td>
                      <td className="py-2 px-2">object</td>
                      <td className="py-2 px-2">Score (0-100) and breakdown metrics</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">mappings</td>
                      <td className="py-2 px-2">array</td>
                      <td className="py-2 px-2">Jargon-to-plain phrase mappings</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">hallucinations</td>
                      <td className="py-2 px-2">array</td>
                      <td className="py-2 px-2">Suspicious citation/claim flags</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono">_cached</td>
                      <td className="py-2 px-2">boolean</td>
                      <td className="py-2 px-2">Whether result was served from cache</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-mono">_quota</td>
                      <td className="py-2 px-2">object</td>
                      <td className="py-2 px-2">Current usage and limit</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-warm-800 dark:text-warm-200 mt-4 mb-2">Response Headers</h3>
              <div className="bg-cream-50 dark:bg-warm-750 rounded-lg p-3 text-xs font-mono space-y-1">
                <div><span className="text-terracotta-500">X-RateLimit-Limit</span>: Monthly translation limit</div>
                <div><span className="text-terracotta-500">X-RateLimit-Remaining</span>: Remaining translations</div>
                <div><span className="text-terracotta-500">X-Cache</span>: HIT or MISS</div>
              </div>
            </section>
          </div>
        )}

        {/* Errors */}
        {tab === 'errors' && (
          <div className="space-y-6">
            <section className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-4">Error Codes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cream-200 dark:border-warm-700">
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Status</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-700 dark:text-warm-300">
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono font-medium">400</td>
                      <td className="py-2 px-2">Invalid request (missing text, text too long, bad JSON)</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono font-medium">401</td>
                      <td className="py-2 px-2">Missing, invalid, or revoked API key</td>
                    </tr>
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-mono font-medium">429</td>
                      <td className="py-2 px-2">Rate limit exceeded (monthly quota full)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-mono font-medium">500</td>
                      <td className="py-2 px-2">Internal error (Claude API failure)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-4">Rate Limits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cream-200 dark:border-warm-700">
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Plan</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Monthly Limit</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Max Text Length</th>
                      <th className="text-left py-2 px-2 text-warm-600 dark:text-warm-400 font-medium">Caching</th>
                    </tr>
                  </thead>
                  <tbody className="text-warm-700 dark:text-warm-300">
                    <tr className="border-b border-cream-100 dark:border-warm-750">
                      <td className="py-2 px-2 font-medium">Free</td>
                      <td className="py-2 px-2">25 translations</td>
                      <td className="py-2 px-2">5,000 chars</td>
                      <td className="py-2 px-2">Yes (does not count toward quota)</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Pro ($9/mo)</td>
                      <td className="py-2 px-2">200 translations</td>
                      <td className="py-2 px-2">15,000 chars</td>
                      <td className="py-2 px-2">Yes (does not count toward quota)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-warm-500 dark:text-warm-400 mt-3">
                Cached responses are returned instantly and do not count against your monthly quota.
                Quotas reset on the 1st of each month.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
