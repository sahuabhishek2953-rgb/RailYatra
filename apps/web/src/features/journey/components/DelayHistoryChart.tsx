import React from 'react';
import { StationEvent } from '@railyatra/types';
import { Clock } from 'lucide-react';

interface DelayHistoryChartProps {
  timeline: StationEvent[];
}

/** Only show stations that have actual arrival data (passed stations) */
function getHaltStations(timeline: StationEvent[]): StationEvent[] {
  return timeline.filter(
    s => s.status === 'COMPLETED' && s.scheduledArrival !== null
  );
}

function shortCode(name: string): string {
  // Return last "word" abbreviation or code
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 4).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
}

export const DelayHistoryChart: React.FC<DelayHistoryChartProps> = ({ timeline }) => {
  const halts = getHaltStations(timeline);
  if (halts.length < 2) return null;

  // Show last 12 passed halts for readability
  const visible = halts.slice(-12);
  const maxDelay = Math.max(...visible.map(s => s.delayMinutes), 5); // min 5 for scale

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#4F6EF7]" />
          Per-Station Delay History
        </h3>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
          Math.max(...visible.map(s => s.delayMinutes)) > 0
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {Math.max(...visible.map(s => s.delayMinutes)) > 0
            ? `${Math.max(...visible.map(s => s.delayMinutes))}m Late`
            : 'On Time'
          }
        </span>
      </div>

      {/* Chart rows */}
      <div className="space-y-1.5">
        {visible.map((stop, i) => {
          const delay = stop.delayMinutes;
          const isOnTime = delay === 0;
          const barPct = isOnTime
            ? 4 // thin green tick
            : Math.min(100, Math.round((delay / maxDelay) * 100));

          return (
            <div key={`${stop.stationId}-${i}`} className="flex items-center gap-2 group">
              {/* Station label */}
              <div className="w-10 shrink-0 text-right">
                <span className="font-mono text-[10px] text-gray-400 group-hover:text-gray-700 transition-colors">
                  {stop.station.code?.slice(0, 4) || shortCode(stop.station.name)}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-5 rounded-md bg-gray-100 overflow-hidden relative">
                <div
                  className={`h-full rounded-md transition-all duration-500 ${
                    isOnTime
                      ? 'bg-emerald-400'
                      : delay <= 5
                      ? 'bg-amber-300'
                      : delay <= 15
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${barPct}%`, minWidth: isOnTime ? '6px' : '12px' }}
                />
              </div>

              {/* Delay label */}
              <div className="w-16 shrink-0">
                <span className={`text-[10px] font-semibold ${
                  isOnTime ? 'text-emerald-600' : 'text-amber-700'
                }`}>
                  {isOnTime ? 'On Time' : `+${delay}m`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-gray-400 text-right">
        Showing last {visible.length} passed stations
      </p>
    </div>
  );
};
