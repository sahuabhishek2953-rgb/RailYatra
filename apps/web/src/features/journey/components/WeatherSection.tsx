import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Droplets, Wind, AlertCircle } from 'lucide-react';
import { WeatherCondition } from '@railyatra/types';
import { Skeleton } from '@/components/ui/Skeleton';

const WEATHER_ICON_MAP: Record<string, string> = {
  Clear: '☀️', Clouds: '⛅', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️'
};

interface WeatherSectionProps {
  lat: number;
  lng: number;
  locationLabel: string;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({ lat, lng, locationLabel }) => {
  const { data: weather, isLoading, isError } = useQuery<WeatherCondition>({
    queryKey: ['weather', lat.toFixed(2), lng.toFixed(2)],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/weather?lat=${lat}&lng=${lng}`, { signal });
      const json = await res.json();
      if (!json.success) throw new Error('Weather fetch failed');
      return json.data as WeatherCondition;
    },
    staleTime: 600_000, // 10 min
    retry: 1
  });

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;

  if (isError || !weather || !weather.isAvailable) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3 text-xs text-gray-500">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <div>
          <div className="font-semibold text-gray-700">{locationLabel}</div>
          <div>Weather information temporarily unavailable.</div>
        </div>
      </div>
    );
  }

  const icon = WEATHER_ICON_MAP[weather.condition] ?? '🌡️';

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Weather</div>
          <div className="font-heading text-sm font-bold text-gray-900 mt-0.5">{locationLabel}</div>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="font-heading text-4xl font-extrabold text-gray-900">{weather.temperatureC}°</span>
          <span className="text-sm text-gray-400 ml-1 font-mono">C</span>
          <div className="text-xs text-gray-500 mt-0.5">Feels like {weather.feelsLikeC}°C · {weather.condition}</div>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            {weather.humidityPercent}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5 text-gray-400" />
            {weather.windSpeedKmh} km/h
          </span>
          {weather.rainForecastMm > 0 && (
            <span className="text-[11px] font-semibold text-blue-600">
              Rain: {weather.rainForecastMm} mm/hr
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
