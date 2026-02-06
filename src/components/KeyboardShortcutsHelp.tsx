'use client';

import { useState, useEffect, useRef } from 'react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'Enter'], description: 'Translate text', context: 'Input view' },
  { keys: ['Ctrl', 'V'], description: 'Paste text or URL (auto-detects URLs)', context: 'Text input' },
  { keys: ['Esc'], description: 'Close dialogs & drawers', context: 'Global' },
];

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 shadow-lg max-w-sm w-full p-5 view-enter"
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-600 dark:hover:text-warm-200 p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-warm-800 dark:text-warm-200">{shortcut.description}</p>
                <p className="text-[10px] text-warm-500 dark:text-warm-500">{shortcut.context}</p>
              </div>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-cream-100 dark:bg-warm-700 text-warm-700 dark:text-warm-300 border border-cream-300 dark:border-warm-600 rounded shadow-sm">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="text-warm-400 text-[10px] mx-0.5">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-cream-200 dark:border-warm-700">
          <p className="text-[10px] text-warm-500 dark:text-warm-500 text-center">
            Press <kbd className="px-1 py-0.5 text-[9px] font-mono bg-cream-100 dark:bg-warm-700 border border-cream-300 dark:border-warm-600 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}
