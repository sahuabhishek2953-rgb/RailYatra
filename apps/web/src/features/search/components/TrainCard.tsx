import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Clock, MapPin, Train as TrainIcon } from 'lucide-react';
import { Train } from '@railyatra/types';
import { useTrainStore } from '@/store/useTrainStore';

interface TrainCardProps {
  train: Train;
}

export const TrainCard: React.FC<TrainCardProps> = ({ train }) => {
  const navigate = useNavigate();
  const { isFavorite, addFavorite, removeFavorite, addRecentSearch } = useTrainStore();
  const fav = isFavorite(train.id);

  const handleClick = () => {
    addRecentSearch(train);
    navigate(`/train/${train.id}`);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fav) {
      removeFavorite(train.id);
    } else {
      // If search result (no source/dest), enrich from API in background before saving
      if (!train.sourceStation?.code) {
        fetch(`/api/v1/trains/${train.id}`)
          .then(r => r.json())
          .then(json => {
            if (json.success && json.data) {
              addFavorite(json.data);
            } else {
              addFavorite(train);
            }
          })
          .catch(() => addFavorite(train));
      } else {
        addFavorite(train);
      }
    }
  };

  const totalHours = train.totalDurationMinutes
    ? `${Math.floor(train.totalDurationMinutes / 60)}h ${train.totalDurationMinutes % 60}m`
    : null;

  const hasRoute = Boolean(train.sourceStation?.code && train.destStation?.code);

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4F6EF7]/40 hover:shadow-lg hover:shadow-[#4F6EF7]/8"
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="shrink-0 rounded-lg bg-gray-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
            #{train.number}
          </span>
          {train.type && (
            <span className="shrink-0 rounded-md bg-[#4F6EF7]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4F6EF7]">
              {train.type}
            </span>
          )}
        </div>
        <button
          onClick={handleFav}
          className="shrink-0 rounded-full p-1.5 text-gray-300 hover:bg-amber-50 hover:text-amber-500 transition-colors"
          title={fav ? 'Remove from favourites' : 'Save to favourites'}
        >
          <Star className={`h-4 w-4 ${fav ? 'fill-amber-400 text-amber-500' : ''}`} />
        </button>
      </div>

      {/* Train Name */}
      <h3 className="mt-3 font-heading text-base font-bold text-gray-900 group-hover:text-[#4F6EF7] transition-colors leading-snug">
        {train.name}
      </h3>

      {/* Route — shown only when source/dest available */}
      {hasRoute ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-900 truncate">
              {train.sourceStation.name || train.sourceStation.code}
            </span>
            <span className="text-[11px] font-mono text-gray-400">{train.sourceStation.code}</span>
          </div>
          <div className="flex flex-col items-center shrink-0 px-1">
            {train.totalDistanceKm > 0 && (
              <span className="text-[10px] font-mono text-gray-400">{train.totalDistanceKm} km</span>
            )}
            <ArrowRight className="h-4 w-4 text-[#4F6EF7]" />
          </div>
          <div className="flex flex-col min-w-0 items-end">
            <span className="font-semibold text-gray-900 truncate">
              {train.destStation.name || train.destStation.code}
            </span>
            <span className="text-[11px] font-mono text-gray-400">{train.destStation.code}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <TrainIcon className="h-3.5 w-3.5" />
          <span>Click to view full route &amp; live tracking</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          {totalHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalHours}
            </span>
          )}
          {train.stopsCount > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {train.stopsCount} stops
            </span>
          )}
        </div>
        <span className="font-semibold text-[#4F6EF7] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
          Track Live <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
};
