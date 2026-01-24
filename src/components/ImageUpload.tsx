'use client';

import { useState, useCallback } from 'react';

interface ImageUploadProps {
  onImageSelect: (base64: string | null) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      const base64 = result.split(',')[1];
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    onImageSelect(null);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-warm-800">
          Or upload an image
        </label>
        {preview && (
          <button
            onClick={handleClear}
            className="text-xs text-warm-600 hover:text-warm-900"
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>

      {preview ? (
        <div className="relative w-full h-52 border border-cream-300 rounded-xl overflow-hidden bg-cream-50">
          <img
            src={preview}
            alt="Uploaded preview"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-52 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer ${
            isDragging
              ? 'border-terracotta-500 bg-terracotta-50'
              : 'border-cream-300 hover:border-cream-400 bg-cream-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <svg
              className="w-10 h-10 text-cream-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-warm-600">
              Drag & drop or <span className="text-terracotta-500 font-medium">browse</span>
            </span>
            <span className="text-xs text-warm-600 mt-1">
              Screenshots of papers, PDFs as images
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
