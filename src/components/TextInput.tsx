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
        <label htmlFor="academic-text" className="text-sm font-medium text-gray-700">
          Paste Academic Text
        </label>
        {text && (
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-700"
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
        className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400"
      />
      <div className="mt-1 text-xs text-gray-500 text-right">
        {text.split(/\s+/).filter(w => w).length} words
      </div>
    </div>
  );
}
