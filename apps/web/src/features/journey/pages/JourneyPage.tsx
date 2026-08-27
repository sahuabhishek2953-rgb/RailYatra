import React, { Suspense, lazy, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { JourneyDetails } from '@railyatra/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { MetricCard } from '@/components/ui/MetricCard';
import { TrainStatusCard } from '../components/TrainStatusCard';
import { JourneyProgress } from '../components/JourneyProgress';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { WeatherSection } from '../components/WeatherSection';
import { ShareModal } from '../components/ShareModal';
import { ElevationChart } from '../components/ElevationChart';
import { DelayHistoryChart } from '../components/DelayHistoryChart';
import { TerrainPOISection } from '../components/TerrainPOISection';
import { useArrivalAlert } from '../hooks/useArrivalAlert';
import { Clock, Navigation, MapPin, Zap, ArrowLeft } from 'lucide-react';

const JourneyMap = lazy(() =>
  import('@/features/map/components/JourneyMap').then(m => ({ default: m.JourneyMap }))
);

export const JourneyPage: React.FC = () => {
  const { trainId } = useParams<{ trainId: string }>();
  const [shareOpen, setShareOpen] = useState(false);

  const {
    data: journey,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<JourneyDetails>({
    queryKey: ['journey', trainId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/trains/${trainId}/journey`, { signal });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Journey data unavailable');
      return json.data as JourneyDetails;
    },
    enabled: Boolean(trainId),
    refetchInterval: 45_000,
    retry: 2
  });

  // Arrival alert hook
  useArrivalAlert(journey?.liveStatus, journey?.train.name ?? '');

  // Callback ref for auto-scroll to current station in timeline
  const handleCurrentStationRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.train.id]);

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError || !journey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>
        <ErrorState
          title="Journey Data Unavailable"
          message={(error as Error)?.message ?? `Could not load live data for train ${trainId}.`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { train, liveStatus, route, timeline, analytics } = journey;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Back Navigation */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Trains
      </Link>

      {/* 1. Live Status Header */}
      <TrainStatusCard train={train} liveStatus={liveStatus} onShare={() => setShareOpen(true)} />

      {/* 2. Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left / Main Column ── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive Map */}
          <div className="h-[420px] sm:h-[500px]">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
              <JourneyMap route={route} liveStatus={liveStatus} timeline={timeline} />
            </Suspense>
          </div>

          {/* Journey Progress Bar */}
          <JourneyProgress liveStatus={liveStatus} />

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label="Delay"
              value={liveStatus.delayMinutes > 0 ? `+${liveStatus.delayMinutes}m` : 'On Time'}
              subtext={liveStatus.delayMinutes > 0 ? 'Behind schedule' : 'Running on schedule'}
              icon={<Clock className="h-5 w-5" />}
              accentColor={liveStatus.delayMinutes > 0 ? 'text-amber-600' : 'text-emerald-600'}
            />
            <MetricCard
              label="Distance"
              value={`${liveStatus.distanceTravelledKm} km`}
              subtext={`of ${train.totalDistanceKm > 0 ? train.totalDistanceKm : '—'} km`}
              icon={<Navigation className="h-5 w-5" />}
            />
            <MetricCard
              label="Stops"
              value={analytics.totalStationsCount > 0
                ? `${analytics.stationsCompletedCount}/${analytics.totalStationsCount}`
                : `${timeline.filter(t => t.status === 'COMPLETED').length}/${timeline.length}`
              }
              subtext="Stations passed"
              icon={<MapPin className="h-5 w-5" />}
            />
            <MetricCard
              label="Speed"
              value={`${liveStatus.location.speedKmh ?? 0} km/h`}
              subtext="Current speed"
              icon={<Zap className="h-5 w-5" />}
            />
          </div>

          {/* Elevation Profile Chart */}
          <ElevationChart
            trainId={train.id}
            currentDistanceKm={liveStatus.distanceTravelledKm}
          />

          {/* Per-Station Delay History */}
          <DelayHistoryChart timeline={timeline} />

          {/* Terrain & Points of Interest */}
          <TerrainPOISection
            lat={liveStatus.location.lat}
            lng={liveStatus.location.lng}
          />
        </div>

        {/* ── Right / Companion Column ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Current station weather */}
          {liveStatus.currentStation.lat !== 20.5937 && (
            <WeatherSection
              lat={liveStatus.currentStation.lat}
              lng={liveStatus.currentStation.lng}
              locationLabel={`${liveStatus.currentStation.name} (Current)`}
            />
          )}

          {/* Next station weather */}
          {liveStatus.nextStation && liveStatus.nextStation.lat !== 20.5937 && (
            <WeatherSection
              lat={liveStatus.nextStation.lat}
              lng={liveStatus.nextStation.lng}
              locationLabel={`${liveStatus.nextStation.name} (Next Stop)`}
            />
          )}

          {/* Route Timeline — scrollable, max height so page stays clean */}
          {timeline.length > 0 && (
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto scrollbar-hide">
                <JourneyTimeline
                  timeline={timeline}
                  onCurrentRef={handleCurrentStationRef}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        trainId={train.id}
        trainName={train.name}
      />
    </div>
  );
};
