'use client';

import { useState } from 'react';
import { HistoryEntry } from '@/types';
import { formatTimestamp, deleteHistoryEntry, clearHistory } from '@/lib/history';
import { getSlopColor } from '@/lib/slopCalculator';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onHistoryChange: () => void;
}

export default function HistoryDrawer({ open, onClose, entries, onSelect, onHistoryChange }: HistoryDrawerProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistoryEntry(id);
    onHistoryChange();
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    clearHistory();
    onHistoryChange();
    setConfirmClear(false);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-warm-800 border-l border-cream-300 dark:border-warm-700 shadow-xl z-40 flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Translation history"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-300 dark:border-warm-700">
          <div>
            <h2 className="text-sm font-semibold text-warm-900 dark:text-warm-100">History</h2>
            <p className="text-xs text-warm-500 dark:text-warm-400">
              {entries.length} translation{entries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={handleClear}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  confirmClear
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium'
                    : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 hover:bg-cream-100 dark:hover:bg-warm-700'
                }`}
              >
                {confirmClear ? 'Confirm clear?' : 'Clear all'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-200 hover:bg-cream-100 dark:hover:bg-warm-700"
              aria-label="Close history"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <svg className="w-10 h-10 text-cream-300 dark:text-warm-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-warm-500 dark:text-warm-400">No translations yet</p>
              <p className="text-xs text-warm-400 dark:text-warm-500 mt-1">Your translations will appear here</p>
            </div>
          ) : (
            <ul className="divide-y divide-cream-200 dark:divide-warm-700">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    onClick={() => { onSelect(entry); onClose(); }}
                    className="w-full text-left px-5 py-3.5 hover:bg-cream-50 dark:hover:bg-warm-700/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-warm-800 dark:text-warm-200 line-clamp-2 leading-snug">
                          {entry.result.coreClaim}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-warm-400 dark:text-warm-500">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                          <span className="text-[10px] text-warm-400 dark:text-warm-500">
                            Level {entry.level}
                          </span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              color: getSlopColor(entry.result.slopIndex.score),
                              backgroundColor: `${getSlopColor(entry.result.slopIndex.score)}15`,
                            }}
                          >
                            Slop {entry.result.slopIndex.score}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-warm-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
                        aria-label="Delete entry"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
