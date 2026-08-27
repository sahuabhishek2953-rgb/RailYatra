import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Train as TrainType } from '@railyatra/types';
import { useTrainStore } from '@/store/useTrainStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrainCard } from '../components/TrainCard';
import {
  Train, Star, Clock, Search, Sparkles, Navigation2,
  ArrowRight, Zap, Map, BarChart3
} from 'lucide-react';

// ─── Debounce hook ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Feature Cards ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Map className="h-5 w-5" />, label: 'Live Map', desc: 'Interactive MapLibre route' },
  { icon: <Zap className="h-5 w-5" />, label: 'Real-time Status', desc: 'Updated every 45 seconds' },
  { icon: <BarChart3 className="h-5 w-5" />, label: 'Journey Analytics', desc: 'Distance, delay & ETA' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 350);
  const { favorites, recentSearches, clearRecentSearches } = useTrainStore();

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Cmd+K shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: results, isLoading, isError, refetch } = useQuery<TrainType[]>({
    queryKey: ['trainSearch', debouncedQuery],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/trains/search?q=${encodeURIComponent(debouncedQuery)}`, { signal });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Search failed');
      return json.data as TrainType[];
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60_000
  });

  const showResults = debouncedQuery.trim().length >= 2;
  const noResults = showResults && !isLoading && !isError && (!results || results.length === 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* ── Hero Section ── */}
      <div className="relative bg-gradient-to-b from-white via-[#F8F9FF] to-[#F3F4FD] border-b border-gray-200/60 px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#4F6EF7]/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#4F6EF7]/10 border border-[#4F6EF7]/20 px-4 py-1.5 text-xs font-semibold text-[#4F6EF7]">
            <Sparkles className="h-3.5 w-3.5" />
            Live Indian Railways Tracking & Journey Intelligence
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Where is your train,{' '}
            <span className="bg-gradient-to-r from-[#4F6EF7] to-[#6B8BFF] bg-clip-text text-transparent">
              right now?
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Search any Indian Railways train. Track it live on an interactive map with real-time delay, ETA, weather, and nearby attractions.
          </p>

          {/* ── Search Bar ── */}
          <div className="relative max-w-2xl mx-auto mt-2">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center pointer-events-none">
                <Train className="h-5 w-5 text-[#4F6EF7]" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && results?.length === 1) {
                    navigate(`/train/${results[0].id}`);
                  }
                }}
                placeholder="Train number or name (e.g. 12952, Rajdhani)..."
                className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pl-12 pr-20 text-sm sm:text-base font-medium text-gray-900 shadow-lg shadow-gray-200/60 transition-all placeholder:text-gray-400 focus:border-[#4F6EF7] focus:outline-none focus:ring-4 focus:ring-[#4F6EF7]/10"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {isLoading ? (
                  <div className="h-5 w-5 rounded-full border-2 border-[#4F6EF7] border-t-transparent animate-spin" />
                ) : query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
                  >
                    ✕
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-400">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs">
                <span className="text-[#4F6EF7]">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results / Dashboard Area ── */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Search Results ── */}
        {showResults && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Search className="h-4 w-4 text-gray-500" />
              <h2 className="font-heading text-lg font-bold text-gray-900">
                Search Results
                {results && results.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({results.length} trains found)</span>
                )}
              </h2>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                    <div className="flex gap-2"><Skeleton className="h-7 w-20" /><Skeleton className="h-7 w-24" /></div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <ErrorState
                message="Could not fetch search results from RailRadar. Please check the train number and try again."
                onRetry={() => refetch()}
              />
            )}

            {noResults && (
              <EmptyState
                title="No trains found"
                description={`No results for "${debouncedQuery}". Try a 5-digit train number like 12952 or a partial name like "Rajdhani".`}
              />
            )}

            {results && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map(train => <TrainCard key={train.id} train={train} />)}
              </div>
            )}
          </section>
        )}

        {/* ── Default Dashboard ── */}
        {!showResults && (
          <div className="space-y-10">
            {/* Favourite Trains */}
            {favorites.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    Saved Favourites
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {favorites.map(train => <TrainCard key={train.id} train={train} />)}
                </div>
              </section>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    Recent Searches
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    Clear history
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recentSearches.map(train => <TrainCard key={train.id} train={train} />)}
                </div>
              </section>
            )}

            {/* Empty state when no history */}
            {favorites.length === 0 && recentSearches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#4F6EF7]/10 mb-5">
                  <Navigation2 className="h-10 w-10 text-[#4F6EF7]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900">Find Your Train</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md">
                  Search for any Indian Railways train above. Your recent searches and favourites will appear here.
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Try: <button onClick={() => setQuery('12952')} className="underline text-[#4F6EF7]">12952</button>
                  {' · '}
                  <button onClick={() => setQuery('Rajdhani')} className="underline text-[#4F6EF7]">Rajdhani</button>
                  {' · '}
                  <button onClick={() => setQuery('Vande Bharat')} className="underline text-[#4F6EF7]">Vande Bharat</button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
