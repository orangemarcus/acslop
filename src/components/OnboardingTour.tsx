'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'acslop_onboarding_seen';

interface TooltipStep {
  target: string; // CSS selector or id
  title: string;
  description: string;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const STEPS: TooltipStep[] = [
  {
    target: '#academic-text',
    title: 'Paste Text or a URL',
    description: 'Drop in dense academic prose, or paste a URL to a paper and we\'ll extract the text for you.',
    position: 'bottom',
  },
  {
    target: '[data-tour="image-upload"]',
    title: 'Or Upload an Image',
    description: 'Take a screenshot of a paper or slide and we\'ll read the text from it.',
    position: 'bottom',
  },
  {
    target: '[data-tour="level-selector"]',
    title: 'Choose Your Level',
    description: 'From "Explain like I\'m 5" to full academic detail — pick how deep you want to go.',
    position: 'top',
  },
  {
    target: '[data-tour="translate-btn"]',
    title: 'Hit Translate',
    description: 'You\'ll see a live streaming response with a Slop Index score, hallucination check, and jargon hover definitions.',
    position: 'top',
  },
];

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        // Small delay so the page renders first
        const timer = setTimeout(() => setActive(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    positionTooltip();
    const handleResize = () => positionTooltip();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [active, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const positionTooltip = () => {
    const current = STEPS[step];
    const el = document.querySelector(current.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const tooltipWidth = 300;
    const gap = 12;

    let style: React.CSSProperties = { position: 'absolute', width: tooltipWidth };

    switch (current.position) {
      case 'bottom':
        style.top = rect.bottom + scrollY + gap;
        style.left = Math.max(16, rect.left + scrollX + rect.width / 2 - tooltipWidth / 2);
        break;
      case 'top':
        style.top = rect.top + scrollY - gap - 140;
        style.left = Math.max(16, rect.left + scrollX + rect.width / 2 - tooltipWidth / 2);
        break;
      case 'right':
        style.top = rect.top + scrollY + rect.height / 2 - 50;
        style.left = rect.right + scrollX + gap;
        break;
      case 'left':
        style.top = rect.top + scrollY + rect.height / 2 - 50;
        style.left = rect.left + scrollX - tooltipWidth - gap;
        break;
    }

    // Keep tooltip on screen horizontally
    const maxLeft = window.innerWidth - tooltipWidth - 16;
    if (typeof style.left === 'number' && style.left > maxLeft) {
      style.left = maxLeft;
    }

    setTooltipStyle(style);

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    setActive(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (!active) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
        onClick={dismiss}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="z-50 bg-white dark:bg-warm-800 rounded-xl border border-cream-300 dark:border-warm-700 shadow-lg p-4 tooltip-enter"
      >
        {/* Arrow indicator dot */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-warm-900 dark:text-warm-100">
            {current.title}
          </h4>
          <button
            onClick={dismiss}
            className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 -mt-1 -mr-1 p-1"
            aria-label="Close tour"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-warm-600 dark:text-warm-400 leading-relaxed mb-3">
          {current.description}
        </p>

        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-terracotta-500' : i < step ? 'bg-terracotta-300' : 'bg-cream-300 dark:bg-warm-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="text-xs text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 px-2 py-1"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="text-xs font-medium bg-terracotta-500 text-white px-3 py-1.5 rounded-lg hover:bg-terracotta-600"
            >
              {step < STEPS.length - 1 ? 'Next' : 'Get started'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
