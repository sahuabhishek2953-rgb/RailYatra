import React from 'react';
import { LiveStatus, Train } from '@railyatra/types';
import { Badge } from '@/components/ui/Badge';
import { useTrainStore } from '@/store/useTrainStore';
import { Share2, Star, RefreshCcw, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface TrainStatusCardProps {
  train: Train;
  liveStatus: LiveStatus;
  onShare: () => void;
}

export const TrainStatusCard: React.FC<TrainStatusCardProps> = ({ train, liveStatus, onShare }) => {
  const { isFavorite, addFavorite, removeFavorite } = useTrainStore();
  const fav = isFavorite(train.id);

  const lastUpdated = React.useMemo(() => {
    try {
      const d = new Date(liveStatus.lastUpdated);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return liveStatus.lastUpdated;
    }
  }, [liveStatus.lastUpdated]);

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-1 w-full ${liveStatus.delayMinutes > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-gray-900 px-2.5 py-1 font-mono text-xs font-bold text-white shrink-0">
                #{train.number}
              </span>
              {train.type && (
                <span className="rounded-md bg-[#4F6EF7]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#4F6EF7] shrink-0">
                  {train.type}
                </span>
              )}
              <Badge variant={liveStatus.delayMinutes > 0 ? 'delayed' : 'on-time'}>
                {liveStatus.delayMinutes > 0 ? `+${liveStatus.delayMinutes} min late` : 'On Time'}
              </Badge>
            </div>
            <h1 className="mt-2 font-heading text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
              {train.name}
            </h1>

            {/* Route breadcrumb */}
            {train.sourceStation?.code && train.destStation?.code && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{train.sourceStation.name || train.sourceStation.code}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-700">{train.destStation.name || train.destStation.code}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (fav) {
                  removeFavorite(train.id);
                  toast.info('Removed from favourites');
                } else {
                  addFavorite(train);
                  toast.success(`${train.name} saved to favourites!`);
                }
              }}
              className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
              title={fav ? 'Remove from favourites' : 'Save to favourites'}
            >
              <Star className={`h-4 w-4 ${fav ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 rounded-xl bg-[#4F6EF7] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3B52D4] transition-colors shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share Live</span>
            </button>
          </div>
        </div>

        {/* Current / Next Station */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Current Station</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="font-heading text-base font-bold text-gray-900">
              {liveStatus.currentStation.name}
            </div>
            <div className="text-xs text-gray-600 mt-0.5 font-mono">
              {liveStatus.currentStation.code}
              {liveStatus.location.speedKmh > 0 && ` · ${liveStatus.location.speedKmh} km/h`}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Next Station</span>
              <Clock className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="font-heading text-base font-bold text-gray-900">
              {liveStatus.nextStation?.name ?? 'Destination'}
            </div>
            <div className="text-xs text-gray-600 mt-0.5 font-mono">
              {liveStatus.nextStation?.code ?? '—'}
              {liveStatus.eta && liveStatus.eta !== '--:--' && ` · ETA: ${liveStatus.eta}`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100">
          <span className="flex items-center gap-1.5">
            <RefreshCcw className="h-3 w-3 animate-spin" style={{ animationDuration: '8s' }} />
            Auto-refreshes every 45s
          </span>
          <span>Last update: {lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};
