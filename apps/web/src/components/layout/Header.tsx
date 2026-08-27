import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, Star, Search, MapPin, Compass } from 'lucide-react';
import { useTrainStore } from '@/store/useTrainStore';

export const Header: React.FC = () => {
  const favorites = useTrainStore((s) => s.favorites);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#4F6EF7] to-[#3B52D4] text-white shadow-md shadow-[#4F6EF7]/20 group-hover:scale-105 transition-transform duration-200">
            <Train className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-tight text-gray-900">
              Rail<span className="text-[#4F6EF7]">Yatra</span>
            </span>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest -mt-1">
              Indian Railways Live
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Search className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">Search Train</span>
          </button>

          {/* Favourites Dropdown / Badge */}
          {favorites.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200/60">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>Favourites</span>
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              </button>

              {/* Favourites Quick Popover */}
              <div className="absolute right-0 top-full mt-1 hidden w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl group-hover:block z-50">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Saved Trains
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {favorites.map((train) => (
                    <Link
                      key={train.id}
                      to={`/train/${train.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-xs text-gray-800 transition-colors"
                    >
                      <div>
                        <div className="font-semibold">{train.number}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[150px]">{train.name}</div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{train.sourceStation.code} → {train.destStation.code}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Network
          </div>
        </div>
      </div>
    </header>
  );
};
