import React, { useState, useEffect, useRef } from 'react';
import { Search, Train, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  isLoading?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-gray-400">
          <Train className="h-5 w-5 text-[#4F6EF7]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search train by name or number (e.g. 12952, Vande Bharat)..."
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-24 text-sm sm:text-base font-medium text-gray-900 shadow-lg shadow-gray-200/50 transition-all placeholder:text-gray-400 focus:border-[#4F6EF7] focus:outline-none focus:ring-4 focus:ring-[#4F6EF7]/10"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#4F6EF7]" />
          ) : value ? (
            <button
              onClick={() => onChange('')}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
              ⌘K
            </kbd>
          )}
        </div>
      </div>
    </div>
  );
};
