import React from 'react';

interface BadgeProps {
  variant: 'on-time' | 'delayed' | 'arrived' | 'cancelled' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const styles = {
    'on-time': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    'delayed': 'bg-amber-50 text-amber-800 border-amber-200/80',
    'arrived': 'bg-blue-50 text-blue-700 border-blue-200/80',
    'cancelled': 'bg-rose-50 text-rose-700 border-rose-200/80',
    'info': 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border shadow-2xs ${styles[variant]} ${className}`}
    >
      {variant === 'on-time' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {variant === 'delayed' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
      {children}
    </span>
  );
};
