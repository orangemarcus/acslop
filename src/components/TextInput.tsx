'use client';

import { useState } from 'react';

interface TextInputProps {
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

export default function TextInput({ onTextChange, disabled }: TextInputProps) {
  const [text, setText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

  const handleClear = () => {
    setText('');
    onTextChange('');
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="academic-text" className="text-sm font-medium text-warm-800">
          Paste academic text
        </label>
        {text && (
          <button
            onClick={handleClear}
            className="text-xs text-warm-600 hover:text-warm-900"
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
        className="w-full h-52 p-4 bg-cream-50 border border-cream-300 rounded-xl resize-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 disabled:opacity-50 disabled:cursor-not-allowed text-warm-900 placeholder-cream-400 text-sm leading-relaxed"
      />
      <div className="mt-1.5 text-xs text-warm-600 text-right">
        {text.split(/\s+/).filter(w => w).length} words
      </div>
    </div>
  );
}
