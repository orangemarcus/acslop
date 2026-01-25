'use client';

import { useState, useEffect } from 'react';

interface TextInputProps {
  onTextChange: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

const MAX_CHARS = 5000;

export default function TextInput({ onTextChange, disabled, initialValue }: TextInputProps) {
  const [text, setText] = useState(initialValue || '');

  useEffect(() => {
    if (initialValue !== undefined) {
      setText(initialValue);
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value.slice(0, MAX_CHARS);
    setText(newText);
    onTextChange(newText);
  };

  const handleClear = () => {
    setText('');
    onTextChange('');
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="academic-text" className="text-sm font-medium text-warm-800 dark:text-warm-200">
          Paste academic text
        </label>
        {text && (
          <button
            onClick={handleClear}
            className="text-xs text-warm-600 hover:text-warm-900 dark:text-warm-400 dark:hover:text-warm-200"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        id="academic-text"
        value={text}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Paste that dense, jargon-filled academic prose here..."
        className="w-full h-52 p-4 bg-cream-50 dark:bg-warm-800 border border-cream-300 dark:border-warm-700 rounded-xl resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed text-warm-900 dark:text-warm-100 placeholder-cream-400 dark:placeholder-warm-500 text-sm leading-relaxed"
      />
      <div className="mt-1.5 flex justify-between text-xs">
        <span className="text-warm-600 dark:text-warm-400">
          {text.split(/\s+/).filter(w => w).length} words
        </span>
        <span className={isNearLimit ? 'text-terracotta-500 font-medium' : 'text-warm-600 dark:text-warm-400'}>
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
