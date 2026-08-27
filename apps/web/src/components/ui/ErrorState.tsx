import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Temporarily Unavailable',
  message,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-red-100 bg-red-50/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-2">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="font-heading text-sm font-semibold text-red-900">{title}</h4>
      <p className="mt-1 text-xs text-red-700 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};
