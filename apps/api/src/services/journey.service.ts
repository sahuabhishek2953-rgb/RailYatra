import { Train, Station, LiveStatus, RouteGeoJSON, StationEvent, JourneyDetails, JourneyAnalytics } from '@railyatra/types';
import {
  rrSearchTrains,
  rrGetTrainDetail,
  rrGetLiveStatus,
  RRRouteStop,
  RRLiveStop,
  RRTrainDetailData,
  RRLiveData,
} from '../providers/railradar.provider';
import { redisCache } from '../lib/redis';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toStation(s: { code?: string; stationCode?: string; name?: string; stationName?: string; lat?: number; lng?: number }): Station {
  const code = (s.code ?? s.stationCode ?? '').toUpperCase();
  const name = (s.name ?? s.stationName ?? '').toUpperCase();
  return { id: code, code, name, lat: s.lat ?? 20.5937, lng: s.lng ?? 78.9629 };
}

function liveStopStatus(s: RRLiveStop): 'COMPLETED' | 'CURRENT' | 'UPCOMING' {
  const st = (s.status ?? '').toLowerCase().replace(/_/g, '-');
  if (st === 'departed') return 'COMPLETED';
  if (st === 'at-station' || st === 'arrived') return 'CURRENT';
  return 'UPCOMING';
}

function formatISO(isoOrTime?: string | null): string | null {
  if (!isoOrTime) return null;
  try {
    const d = new Date(isoOrTime);
    if (isNaN(d.getTime())) return isoOrTime;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return isoOrTime; }
}

function buildTrainFromDetail(data: RRTrainDetailData): Train {
  const t = data.train;
  const src = toStation({ code: t.source.code, name: t.source.name, lat: t.source.lat, lng: t.source.lng });
  const dst = toStation({ code: t.destination.code, name: t.destination.name, lat: t.destination.lat, lng: t.destination.lng });
  return {
    id: t.number, number: t.number, name: t.name, type: t.type,
    sourceStationId: src.id, destStationId: dst.id,
    sourceStation: src, destStation: dst,
    totalDistanceKm: t.distance, totalDurationMinutes: t.duration,
    stopsCount: data.route.filter(r => r.isHalt).length
  };
}

function buildLiveStatus(live: RRLiveData, train: Train): LiveStatus {
  // currentLocation → current station
  const curLoc = live.currentLocation;
  const currentSt: Station = curLoc
    ? { id: curLoc.stationCode, code: curLoc.stationCode, name: curLoc.stationName, lat: 20.5937, lng: 78.9629 }
    : train.sourceStation;

  // Try to get lat/lng from route stops
  const routeMap = new Map<string, { lat: number; lng: number }>();
  for (const stop of (live.route ?? [])) {
    // Route stops in live endpoint don't have lat/lng, but we'll fill from train detail later
  }

  // nextHalt → next station
  const nextHalt = live.nextHalt;
  const nextSt: Station | null = nextHalt
    ? { id: nextHalt.stationCode, code: nextHalt.stationCode, name: nextHalt.stationName, lat: 20.5937, lng: 78.9629 }
    : null;

  // Compute completion from sequence position
  const totalStops = live.route?.length ?? 1;
  const curSeq = curLoc?.sequence ?? 0;
  const maxSeq = live.route?.[live.route.length - 1]?.sequence ?? totalStops;
  const completionPct = live.completionPercent
    ?? Math.round((curSeq / Math.max(maxSeq, 1)) * 100);

  const distTravelled = Math.round(train.totalDistanceKm * completionPct / 100);
  const distRemaining = Math.max(0, train.totalDistanceKm - distTravelled);

  const lastUpdated = live.lastUpdatedAt ?? new Date().toISOString();
  const delay = live.delayMinutes ?? 0;

  // Compute realistic speed in km/h
  let speedKmh = 0;
  const trainStatus = (live.status ?? '').toLowerCase();
  if (trainStatus !== 'not-started' && trainStatus !== 'arrived') {
    const curStop = live.route?.find(s => s.sequence === curSeq);
    if (curStop?.speedToNextStationKmph && curStop.speedToNextStationKmph > 0) {
      speedKmh = Math.round(curStop.speedToNextStationKmph);
    } else {
      // Find nearest stop with speedToNextStationKmph
      const nearbyStop = live.route?.slice(Math.max(0, curSeq - 3), curSeq + 4).find(s => s.speedToNextStationKmph && s.speedToNextStationKmph > 0);
      if (nearbyStop?.speedToNextStationKmph) {
        speedKmh = Math.round(nearbyStop.speedToNextStationKmph);
      } else if (train.totalDistanceKm > 0 && train.totalDurationMinutes > 0) {
        // Average schedule speed in km/h
        speedKmh = Math.round(train.totalDistanceKm / (train.totalDurationMinutes / 60));
      } else {
        speedKmh = 65; // Default Indian Railways cruising speed
      }
    }
  }

  return {
    trainId: train.id,
    journeyId: `J_${train.id}_${new Date().toISOString().split('T')[0]}`,
    currentStationId: currentSt.id,
    currentStation: currentSt,
    nextStationId: nextSt?.id ?? null,
    nextStation: nextSt,
    status: delay > 0 ? 'DELAYED' : 'ON_TIME',
    delayMinutes: delay,
    eta: '--:--',
    distanceTravelledKm: distTravelled,
    distanceRemainingKm: distRemaining,
    journeyCompletionPercent: completionPct,
    lastUpdated,
    location: {
      lat: currentSt.lat,
      lng: currentSt.lng,
      speedKmh,
      heading: 0,
      timestamp: lastUpdated
    },
    hasLiveGps: Boolean(live.isLive)
  };
}

function buildTimeline(liveRoute: RRLiveStop[], routeStops: RRRouteStop[]): StationEvent[] {
  // Build coordinate lookup from static route (which has lat/lng)
  const coordMap = new Map<string, { lat: number; lng: number }>();
  for (const r of routeStops) {
    if (r.station.lat && r.station.lng) {
      coordMap.set(r.station.code, { lat: r.station.lat, lng: r.station.lng });
    }
  }

  return liveRoute.map((stop): StationEvent => {
    const coords = coordMap.get(stop.stationCode) ?? { lat: 20.5937, lng: 78.9629 };
    return {
      stationId: stop.stationCode,
      station: { id: stop.stationCode, code: stop.stationCode, name: stop.stationName, lat: coords.lat, lng: coords.lng },
      scheduledArrival: formatISO(stop.scheduledArrival),
      actualArrival: formatISO(stop.actualArrival),
      scheduledDeparture: formatISO(stop.scheduledDeparture),
      actualDeparture: formatISO(stop.actualDeparture),
      delayMinutes: stop.delayArrival ?? stop.delayDeparture ?? 0,
      status: liveStopStatus(stop),
      platform: stop.platform
    };
  });
}

function enrichStationsWithCoords(liveStatus: LiveStatus, detailRoute: RRRouteStop[]): void {
  // Enrich current and next station lat/lng from static route coords
  const coordMap = new Map<string, { lat: number; lng: number }>();
  for (const r of detailRoute) {
    if (r.station.lat && r.station.lng) {
      coordMap.set(r.station.code, { lat: r.station.lat, lng: r.station.lng });
    }
  }

  const cur = coordMap.get(liveStatus.currentStation.code);
  if (cur) {
    liveStatus.currentStation.lat = cur.lat;
    liveStatus.currentStation.lng = cur.lng;
    liveStatus.location.lat = cur.lat;
    liveStatus.location.lng = cur.lng;
  }

  if (liveStatus.nextStation) {
    const nxt = coordMap.get(liveStatus.nextStation.code);
    if (nxt) {
      liveStatus.nextStation.lat = nxt.lat;
      liveStatus.nextStation.lng = nxt.lng;
    }
  }
}

function buildRoute(routeStops: RRRouteStop[], train: Train): RouteGeoJSON {
  const coords: [number, number][] = routeStops
    .filter(s => s.station.lat && s.station.lng)
    .map(s => [s.station.lng, s.station.lat] as [number, number]);

  if (coords.length < 2) {
    coords.push([train.sourceStation.lng, train.sourceStation.lat]);
    coords.push([train.destStation.lng, train.destStation.lat]);
  }

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: { trainId: train.id, source: train.sourceStation.name, destination: train.destStation.name }
    }]
  };
}

// ─── TrainService ─────────────────────────────────────────────────────────────

export class TrainService {
  static async searchTrains(query: string): Promise<Train[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = await redisCache.get<Train[]>(cacheKey);
    if (cached) return cached;

    const results = await rrSearchTrains(q);
    const trains: Train[] = results.map(r => ({
      id: r.number, number: r.number, name: r.name, type: 'Express',
      sourceStationId: '', destStationId: '',
      sourceStation: { id: '', code: '', name: '', lat: 20.5937, lng: 78.9629 },
      destStation: { id: '', code: '', name: '', lat: 20.5937, lng: 78.9629 },
      totalDistanceKm: 0, totalDurationMinutes: 0, stopsCount: 0
    }));

    await redisCache.set(cacheKey, trains, 300);
    return trains;
  }
}

// ─── JourneyService ──────────────────────────────────────────────────────────

export class JourneyService {
  private static async fetchTrainDetail(number: string): Promise<RRTrainDetailData> {
    const cacheKey = `rrdetail:${number}`;
    const cached = await redisCache.get<RRTrainDetailData>(cacheKey);
    if (cached) return cached;
    const data = await rrGetTrainDetail(number);
    await redisCache.set(cacheKey, data, 86400);
    return data;
  }

  private static async fetchLiveStatus(number: string): Promise<RRLiveData> {
    const cacheKey = `rrlive:${number}`;
    const cached = await redisCache.get<RRLiveData>(cacheKey);
    if (cached) return cached;
    const data = await rrGetLiveStatus(number);
    await redisCache.set(cacheKey, data, 45);
    return data;
  }

  static async getLiveStatus(number: string): Promise<{ status: LiveStatus; train: Train } | null> {
    const [detailData, liveData] = await Promise.all([
      this.fetchTrainDetail(number),
      this.fetchLiveStatus(number)
    ]);
    const train = buildTrainFromDetail(detailData);
    const liveStatus = buildLiveStatus(liveData, train);
    enrichStationsWithCoords(liveStatus, detailData.route);
    return { status: liveStatus, train };
  }

  static async getRoute(number: string, train: Train): Promise<RouteGeoJSON> {
    const cacheKey = `route:${number}`;
    const cached = await redisCache.get<RouteGeoJSON>(cacheKey);
    if (cached) return cached;
    const data = await this.fetchTrainDetail(number);
    const route = buildRoute(data.route, train);
    await redisCache.set(cacheKey, route, 86400);
    return route;
  }

  static async getJourneyDetails(number: string): Promise<JourneyDetails | null> {
    const [detailData, liveData] = await Promise.all([
      this.fetchTrainDetail(number),
      this.fetchLiveStatus(number)
    ]);

    const train = buildTrainFromDetail(detailData);
    const liveStatus = buildLiveStatus(liveData, train);
    enrichStationsWithCoords(liveStatus, detailData.route);
    const route = buildRoute(detailData.route, train);
    const timeline = buildTimeline(liveData.route ?? [], detailData.route);

    const completedCount = timeline.filter(t => t.status === 'COMPLETED').length;

    const analytics: JourneyAnalytics = {
      completionPercent: liveStatus.journeyCompletionPercent,
      distanceTravelledKm: liveStatus.distanceTravelledKm,
      distanceRemainingKm: liveStatus.distanceRemainingKm,
      totalDistanceKm: train.totalDistanceKm,
      currentDelayMinutes: liveStatus.delayMinutes,
      stationsCompletedCount: completedCount,
      totalStationsCount: timeline.length,
      highestElevationMeters: 0,
      statesCrossed: [],
      lastUpdated: liveStatus.lastUpdated
    };

    return { train, liveStatus, route, timeline, analytics };
  }
}
