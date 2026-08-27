import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NearbyPlace } from '@railyatra/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Waves, Mountain, Landmark, Building2, TreePine, Globe, ExternalLink, Sparkles } from 'lucide-react';

interface TerrainPOISectionProps {
  lat: number;
  lng: number;
}

// ── Category configuration matching user screenshot ──────────────────────────

const CATEGORY_CONFIG: Record<
  NearbyPlace['category'],
  { label: string; icon: React.ReactNode; bg: string; text: string; badgeBg: string; border: string }
> = {
  RIVER: {
    label: 'RIVER',
    icon: <Waves className="h-5 w-5 text-sky-600" />,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    badgeBg: 'bg-sky-100/80 text-sky-800',
    border: 'border-sky-200/70'
  },
  LAKE: {
    label: 'LAKE',
    icon: <Waves className="h-5 w-5 text-cyan-600" />,
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    badgeBg: 'bg-cyan-100/80 text-cyan-800',
    border: 'border-cyan-200/70'
  },
  MOUNTAIN: {
    label: 'PEAK',
    icon: <Mountain className="h-5 w-5 text-emerald-700" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    badgeBg: 'bg-emerald-100/80 text-emerald-900',
    border: 'border-emerald-200/70'
  },
  BRIDGE: {
    label: 'BRIDGE',
    icon: <Landmark className="h-5 w-5 text-amber-700" />,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    badgeBg: 'bg-amber-100/80 text-amber-900',
    border: 'border-amber-200/70'
  },
  TUNNEL: {
    label: 'TUNNEL',
    icon: <Landmark className="h-5 w-5 text-stone-700" />,
    bg: 'bg-stone-50',
    text: 'text-stone-800',
    badgeBg: 'bg-stone-100/80 text-stone-900',
    border: 'border-stone-200/70'
  },
  CITY: {
    label: 'CITY',
    icon: <Building2 className="h-5 w-5 text-violet-600" />,
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    badgeBg: 'bg-violet-100/80 text-violet-800',
    border: 'border-violet-200/70'
  },
  DISTRICT: {
    label: 'DISTRICT',
    icon: <Globe className="h-5 w-5 text-indigo-600" />,
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    badgeBg: 'bg-indigo-100/80 text-indigo-800',
    border: 'border-indigo-200/70'
  },
  MONUMENT: {
    label: 'HERITAGE',
    icon: <TreePine className="h-5 w-5 text-amber-700" />,
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    badgeBg: 'bg-amber-100/80 text-amber-900',
    border: 'border-amber-200/70'
  },
  ATTRACTION: {
    label: 'ATTRACTION',
    icon: <Sparkles className="h-5 w-5 text-[#4F6EF7]" />,
    bg: 'bg-blue-50',
    text: 'text-[#4F6EF7]',
    badgeBg: 'bg-blue-100/80 text-[#3B52D4]',
    border: 'border-blue-200/70'
  },
};

// ── POI Card ─────────────────────────────────────────────────────────────────

const POICard: React.FC<{ place: NearbyPlace }> = ({ place }) => {
  const cfg = CATEGORY_CONFIG[place.category] ?? CATEGORY_CONFIG.ATTRACTION;

  return (
    <div className="flex-shrink-0 w-48 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top row with Icon */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.bg} border ${cfg.border} shadow-xs`}>
            {cfg.icon}
          </div>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
        </div>

        {/* Place Name */}
        <h4 className="font-heading text-sm font-bold text-gray-900 line-clamp-2 leading-snug" title={place.name}>
          {place.name}
        </h4>

        {/* Description snippet if present */}
        {place.description && (
          <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        )}
      </div>

      {/* Footer with Distance & link */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-mono font-medium text-gray-400">
          ~{place.distanceFromTrainKm} km away
        </span>
        {place.wikipediaUrl && (
          <a
            href={place.wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#4F6EF7] hover:underline"
            title="Read on Wikipedia"
          >
            Wiki <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export const TerrainPOISection: React.FC<TerrainPOISectionProps> = ({ lat, lng }) => {
  const { data: places, isLoading, isError } = useQuery<NearbyPlace[]>({
    queryKey: ['nearby', lat.toFixed(2), lng.toFixed(2)],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/nearby?lat=${lat}&lng=${lng}&radius=50`, { signal });
      const json = await res.json();
      if (!json.success) return [];
      return json.data as NearbyPlace[];
    },
    staleTime: 3_600_000,
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-48 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = places && places.length > 0 ? places : [];

  if (items.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-bold text-gray-900 flex items-center gap-2">
          <Mountain className="h-5 w-5 text-emerald-600" />
          Terrain &amp; Points of Interest
        </h3>
        <span className="text-[11px] text-gray-400 font-mono">Live Geography</span>
      </div>

      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
        {items.map((place) => (
          <div key={place.id} className="snap-start">
            <POICard place={place} />
          </div>
        ))}
      </div>
    </div>
  );
};
