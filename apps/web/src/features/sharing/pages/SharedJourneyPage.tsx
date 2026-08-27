import React, { Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SharedJourneySnapshot } from '@railyatra/types';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowRight, Train, ExternalLink, ArrowLeft } from 'lucide-react';

// Use the same lazy import as JourneyPage — no static import
const JourneyMap = lazy(() =>
  import('@/features/map/components/JourneyMap').then(m => ({ default: m.JourneyMap }))
);

export const SharedJourneyPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data: snapshot, isLoading, isError } = useQuery<SharedJourneySnapshot>({
    queryKey: ['sharedJourney', token],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/v1/shared/${token}`, { signal });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Shared link expired or invalid');
      return json.data as SharedJourneySnapshot;
    },
    enabled: Boolean(token)
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !snapshot) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 space-y-4 text-center">
        <ErrorState
          title="Link Expired or Invalid"
          message="This public tracking link is either invalid or has expired after 7 days."
        />
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#4F6EF7] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3B52D4] transition-colors"
        >
          <Train className="h-4 w-4" />
          Track Any Train on RailYatra
        </Link>
      </div>
    );
  }

  const { train, liveStatus, route, timeline } = snapshot;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Public Banner */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-gray-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                #{train.number}
              </span>
              <Badge variant={liveStatus.delayMinutes > 0 ? 'delayed' : 'on-time'}>
                {liveStatus.delayMinutes > 0 ? `+${liveStatus.delayMinutes} min late` : 'On Time'}
              </Badge>
              <span className="text-xs text-gray-400 italic">Public Live Tracking</span>
            </div>
            <h1 className="mt-2 font-heading text-xl sm:text-2xl font-bold text-gray-900">
              {train.name}
            </h1>
            {train.sourceStation?.name && train.destStation?.name && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                <span>{train.sourceStation.name}</span>
                <ArrowRight className="h-3.5 w-3.5" />
                <span>{train.destStation.name}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Near <strong className="text-gray-800">{liveStatus.currentStation.name}</strong>
              {liveStatus.nextStation && (
                <> · Next: <strong className="text-gray-800">{liveStatus.nextStation.name}</strong></>
              )}
            </p>
          </div>

          <Link
            to={`/train/${train.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4F6EF7] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3B52D4] shrink-0 shadow-sm transition-colors"
          >
            Track Full Journey
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          {[
            { label: 'Current', value: liveStatus.currentStation.name },
            { label: 'Next Stop', value: liveStatus.nextStation?.name ?? 'Destination' },
            { label: 'ETA', value: liveStatus.eta !== '--:--' ? liveStatus.eta : 'N/A' },
            { label: 'Progress', value: `${liveStatus.journeyCompletionPercent}%`, highlight: true },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</div>
              <div className={`font-heading text-sm font-bold mt-0.5 truncate ${s.highlight ? 'text-[#4F6EF7]' : 'text-gray-900'}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[450px] w-full">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
          <JourneyMap route={route} liveStatus={liveStatus} timeline={timeline} />
        </Suspense>
      </div>

      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Track another train
      </Link>
    </div>
  );
};
