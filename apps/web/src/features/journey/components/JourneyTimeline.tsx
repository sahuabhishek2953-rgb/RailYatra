import React from 'react';
import { StationEvent } from '@railyatra/types';
import { CheckCircle2, Circle, Radio } from 'lucide-react';

interface JourneyTimelineProps {
  timeline: StationEvent[];
  onCurrentRef?: (el: HTMLDivElement | null) => void;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ timeline, onCurrentRef }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-base font-bold text-gray-900">Route Timeline</h3>
        <span className="text-xs font-mono text-gray-400">{timeline.length} stops</span>
      </div>

      <div className="relative pl-7">
        {/* Vertical line */}
        <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gray-200" />

        <div className="space-y-5">
          {timeline.map((stop, idx) => {
            const isCompleted = stop.status === 'COMPLETED';
            const isCurrent = stop.status === 'CURRENT';

            return (
              <div
                key={`${stop.stationId}-${idx}`}
                className="relative"
                ref={isCurrent ? onCurrentRef : undefined}
              >
                {/* Icon */}
                <div className="absolute -left-7 top-0.5 flex h-5 w-5 items-center justify-center bg-white">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : isCurrent ? (
                    <Radio className="h-5 w-5 text-[#4F6EF7] animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex items-start justify-between gap-2 pb-5 border-b border-gray-100 last:border-0 last:pb-0 ${isCompleted ? 'opacity-70' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-heading text-sm font-bold leading-tight ${isCurrent ? 'text-[#4F6EF7]' : 'text-gray-900'}`}>
                        {stop.station.name}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">({stop.station.code})</span>
                      {stop.platform && (
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">
                          PF {stop.platform}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] bg-[#4F6EF7]/10 text-[#4F6EF7] font-bold px-1.5 py-0.5 rounded">
                          CURRENT
                        </span>
                      )}
                    </div>
                    {stop.station.state && (
                      <div className="text-[11px] text-gray-400 mt-0.5">{stop.station.state}</div>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs space-y-0.5">
                    {stop.scheduledArrival && (
                      <div className="text-gray-500">Sch: {stop.scheduledArrival}</div>
                    )}
                    {stop.actualArrival && (
                      <div className={`font-semibold ${stop.delayMinutes > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        Act: {stop.actualArrival}
                      </div>
                    )}
                    {stop.delayMinutes > 0 ? (
                      <div className="text-[10px] text-amber-600 font-bold">+{stop.delayMinutes}m</div>
                    ) : stop.actualArrival ? (
                      <div className="text-[10px] text-emerald-600 font-bold">On time</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
