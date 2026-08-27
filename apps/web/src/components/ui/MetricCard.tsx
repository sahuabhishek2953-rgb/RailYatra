import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor = 'text-[#4F6EF7]'
}) => {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 ${accentColor}`}>
        {icon}
      </div>
      <div>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className="font-heading text-lg font-bold text-gray-900 leading-tight">{value}</div>
        {subtext && <div className="text-[11px] text-gray-500">{subtext}</div>}
      </div>
    </div>
  );
};
