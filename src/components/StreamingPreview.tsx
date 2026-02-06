'use client';

interface StreamingPreviewProps {
  status: string;
  onCancel: () => void;
}

export default function StreamingPreview({ status, onCancel }: StreamingPreviewProps) {
  return (
    <div className="space-y-6 view-enter">
      {/* Status card */}
      <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-8 shadow-soft">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Animated dots */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 bg-terracotta-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 bg-terracotta-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 bg-terracotta-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <div>
            <p className="text-sm font-medium text-warm-800 dark:text-warm-200">
              {status}
            </p>
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">
              Streaming response from Claude
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="h-1 bg-cream-200 dark:bg-warm-700 rounded-full overflow-hidden">
              <div className="h-full bg-terracotta-500 rounded-full streaming-progress" />
            </div>
          </div>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="mt-2 px-4 py-1.5 text-xs font-medium text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 border border-cream-300 dark:border-warm-700 hover:border-cream-400 dark:hover:border-warm-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
