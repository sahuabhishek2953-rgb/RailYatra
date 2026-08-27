import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, Landmark, Mountain, Waves } from 'lucide-react';
import { NearbyPlace } from '@railyatra/types';
import { Skeleton } from '@/components/ui/Skeleton';

const CATEGORY_ICONS: Record<NearbyPlace['category'], React.ReactNode> = {
  RIVER: <Waves className="h-4 w-4 text-blue-500" />,
  LAKE: <Waves className="h-4 w-4 text-cyan-500" />,
  MOUNTAIN: <Mountain className="h-4 w-4 text-amber-700" />,
  BRIDGE: <Landmark className="h-4 w-4 text-gray-500" />,
  TUNNEL: <Landmark className="h-4 w-4 text-gray-600" />,
  CITY: <Compass className="h-4 w-4 text-violet-500" />,
  DISTRICT: <Compass className="h-4 w-4 text-violet-400" />,
  MONUMENT: <Landmark className="h-4 w-4 text-amber-600" />,
  ATTRACTION: <Landmark className="h-4 w-4 text-[#4F6EF7]" />,
};

interface NearbySectionProps {
  lat: number;
  lng: number;
}

export const NearbySection: React.FC<NearbySectionProps> = ({ lat, lng }) => {
  const { data: places, isLoading } = useQuery<NearbyPlace[]>({
    queryKey: ['nearby', lat.toFixed(2), lng.toFixed(2)],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/nearby?lat=${lat}&lng=${lng}&radius=50`, { signal });
      const json = await res.json();
      if (!json.success) return [];
      return json.data as NearbyPlace[];
    },
    staleTime: 3_600_000,
    retry: 0
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!places || places.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-bold text-gray-900 flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#4F6EF7]" />
          Nearby Geography & Attractions
        </h3>
        <span className="text-[11px] font-mono text-gray-400">Within 50 km</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {places.slice(0, 8).map(place => (
          <div
            key={place.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs">
              {CATEGORY_ICONS[place.category] ?? <Landmark className="h-4 w-4 text-gray-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-xs font-bold text-gray-900 truncate">{place.name}</span>
                <span className="text-[11px] font-mono text-gray-500 shrink-0">{place.distanceFromTrainKm} km</span>
              </div>
              {place.description && (
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{place.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
