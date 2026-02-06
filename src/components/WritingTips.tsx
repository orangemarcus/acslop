'use client';

import { SlopBreakdown } from '@/types';

interface WritingTipsProps {
  breakdown: SlopBreakdown;
  score: number;
}

interface Tip {
  category: string;
  icon: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function generateTips(breakdown: SlopBreakdown, score: number): Tip[] {
  const tips: Tip[] = [];

  // Passive voice tips
  if (breakdown.passiveVoice > 40) {
    tips.push({
      category: 'passive',
      icon: 'voice',
      severity: 'high',
      title: 'Heavy passive voice usage',
      description: `${breakdown.passiveVoice}% of sentences use passive voice. Try rewriting with active subjects: "We found..." instead of "It was found that..."`,
    });
  } else if (breakdown.passiveVoice > 25) {
    tips.push({
      category: 'passive',
      icon: 'voice',
      severity: 'medium',
      title: 'Moderate passive voice',
      description: `${breakdown.passiveVoice}% passive voice detected. Consider converting some passive constructions to active voice for more direct statements.`,
    });
  }

  // Nominalization tips
  if (breakdown.nominalizations > 8) {
    tips.push({
      category: 'nominal',
      icon: 'noun',
      severity: 'high',
      title: 'Excessive nominalizations',
      description: `${breakdown.nominalizations} nominalizations found. Replace noun-heavy phrases with verbs: "investigation of" → "investigate", "utilization of" → "use".`,
    });
  } else if (breakdown.nominalizations > 4) {
    tips.push({
      category: 'nominal',
      icon: 'noun',
      severity: 'medium',
      title: 'Some nominalizations detected',
      description: `${breakdown.nominalizations} nominalizations found. Consider using simpler verb forms where possible to improve readability.`,
    });
  }

  // Hedge word tips
  if (breakdown.hedgeWords > 6) {
    tips.push({
      category: 'hedge',
      icon: 'hedge',
      severity: 'high',
      title: 'Too many hedge words',
      description: `${breakdown.hedgeWords} hedge words found. Words like "potentially", "somewhat", "arguably" weaken your claims. Be more direct when evidence supports it.`,
    });
  } else if (breakdown.hedgeWords > 3) {
    tips.push({
      category: 'hedge',
      icon: 'hedge',
      severity: 'medium',
      title: 'Hedging language detected',
      description: `${breakdown.hedgeWords} hedge words found. Some hedging is appropriate, but consider removing unnecessary qualifiers.`,
    });
  }

  // Jargon density tips
  if (breakdown.jargonDensity > 3) {
    tips.push({
      category: 'jargon',
      icon: 'jargon',
      severity: 'high',
      title: 'Very high jargon density',
      description: `${breakdown.jargonDensity} jargon terms per sentence. Define key terms on first use and replace unnecessary jargon with plain alternatives.`,
    });
  } else if (breakdown.jargonDensity > 1.5) {
    tips.push({
      category: 'jargon',
      icon: 'jargon',
      severity: 'medium',
      title: 'Moderate jargon usage',
      description: `${breakdown.jargonDensity} jargon terms per sentence. Consider whether all technical terms are necessary for your audience.`,
    });
  }

  // Sentence length tips
  if (breakdown.sentenceLength > 35) {
    tips.push({
      category: 'length',
      icon: 'length',
      severity: 'high',
      title: 'Very long sentences',
      description: `Average ${breakdown.sentenceLength} words per sentence. Break complex sentences into shorter ones. Aim for 15-25 words per sentence for maximum clarity.`,
    });
  } else if (breakdown.sentenceLength > 25) {
    tips.push({
      category: 'length',
      icon: 'length',
      severity: 'medium',
      title: 'Long sentences',
      description: `Average ${breakdown.sentenceLength} words per sentence. Consider splitting some longer sentences for better readability.`,
    });
  }

  // Overall score tips
  if (score <= 20 && tips.length === 0) {
    tips.push({
      category: 'overall',
      icon: 'star',
      severity: 'low',
      title: 'Excellent clarity!',
      description: 'This text scores very well on readability. The writing is clear, direct, and accessible.',
    });
  } else if (score > 70) {
    tips.push({
      category: 'overall',
      icon: 'warning',
      severity: 'high',
      title: 'Major clarity issues',
      description: 'This text has significant readability barriers. A comprehensive rewrite focusing on simpler language and shorter sentences would help.',
    });
  }

  return tips;
}

function SeverityDot({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[severity]} flex-shrink-0`} />;
}

function TipIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'voice':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
    case 'noun':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    case 'hedge':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'jargon':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'length':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      );
    case 'star':
      return (
        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function WritingTips({ breakdown, score }: WritingTipsProps) {
  const tips = generateTips(breakdown, score);

  if (tips.length === 0) return null;

  return (
    <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-5 shadow-soft">
      <h3 className="text-xs font-semibold text-warm-600 dark:text-warm-400 uppercase tracking-wider flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Writing Tips
      </h3>

      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-cream-50 dark:bg-warm-750 border border-cream-200 dark:border-warm-700"
          >
            <div className="flex-shrink-0 mt-0.5 text-warm-500 dark:text-warm-400">
              <TipIcon icon={tip.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <SeverityDot severity={tip.severity} />
                <span className="text-sm font-medium text-warm-800 dark:text-warm-200">
                  {tip.title}
                </span>
              </div>
              <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
