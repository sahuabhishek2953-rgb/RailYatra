import React from 'react';
import { LiveStatus } from '@railyatra/types';

interface JourneyProgressProps {
  liveStatus: LiveStatus;
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({ liveStatus }) => {
  const percent = Math.min(100, Math.max(0, liveStatus.journeyCompletionPercent));

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Journey Completion
        </span>
        <span className="font-mono text-sm font-extrabold text-[#4F6EF7]">
          {percent}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-3 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4F6EF7] to-[#3B52D4] transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stats Below */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-mono pt-1">
        <span>{liveStatus.distanceTravelledKm} km covered</span>
        <span>{liveStatus.distanceRemainingKm} km remaining</span>
      </div>
    </div>
  );
};
