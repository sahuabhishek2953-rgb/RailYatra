import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Mountain } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  lat: number;
  lng: number;
}

interface ElevationChartProps {
  trainId: string;
  currentDistanceKm: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ElevationPoint;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <div className="font-bold text-gray-900">{d.elevationM} m</div>
      <div className="text-gray-500 mt-0.5">{d.distanceKm} km from source</div>
    </div>
  );
};

export const ElevationChart: React.FC<ElevationChartProps> = ({ trainId, currentDistanceKm }) => {
  const { data: points, isLoading, isError } = useQuery<ElevationPoint[]>({
    queryKey: ['elevation', trainId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/trains/${trainId}/elevation`, { signal });
      const json = await res.json();
      if (!json.success) throw new Error('Elevation unavailable');
      return json.data as ElevationPoint[];
    },
    staleTime: 86400 * 1000, // 24h — terrain doesn't change
    retry: 1
  });

  if (isLoading) return <Skeleton className="h-44 w-full rounded-2xl" />;

  // Don't render if no data or all zeros (API unavailable)
  if (isError || !points || points.length < 3) return null;
  const hasRealData = points.some(p => p.elevationM > 0);
  if (!hasRealData) return null;

  const maxElev = Math.max(...points.map(p => p.elevationM));
  const minElev = Math.min(...points.map(p => p.elevationM));

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Mountain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-gray-900">Elevation Profile</h3>
            <p className="text-[11px] text-gray-500">
              {minElev}m – {maxElev}m · {points[points.length - 1]?.distanceKm} km total
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          SRTM 30m
        </span>
      </div>

      {/* Chart */}
      <div className="px-1 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={points} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="distanceKm"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={v => `${v}km`}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={v => `${v}m`}
              width={44}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Current position marker */}
            {currentDistanceKm > 0 && (
              <ReferenceLine
                x={currentDistanceKm}
                stroke="#4F6EF7"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{ value: '▲ You', position: 'top', fontSize: 10, fill: '#4F6EF7' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="elevationM"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#elevGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
