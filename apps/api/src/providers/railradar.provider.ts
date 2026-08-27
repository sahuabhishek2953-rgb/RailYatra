/**
 * RailRadar API Provider — verified against real API responses
 * Base URL: https://api.railradar.in/v1
 * Auth: Authorization: Bearer <key>
 *
 * Verified endpoint shapes (2026-08-16):
 *  GET /lookup/trains?q=<query>  → { data: { "number": "name", ... }, meta }
 *  GET /trains/:number           → { data: { train: {...}, route: [...] }, meta }
 *  GET /trains/:number/live      → { data: { position, schedule, ... }, meta }
 */

const BASE_URL = 'https://api.railradar.in/v1';

// Read lazily so dotenv.config() in index.ts has time to populate process.env
const getHeaders = () => {
  const key = process.env.RAILRADAR_API_KEY;
  if (!key) throw new Error('RAILRADAR_API_KEY is not set in environment');
  return {
    'Authorization': `Bearer ${key}`,
    'Accept': 'application/json'
  };
};

async function rrFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RailRadar [${res.status}] ${path}: ${text}`);
  }
  const json = await res.json();
  return json.data as T;
}

// ─── Exact API response types ────────────────────────────────────────────────

/** /lookup/trains response — flat {number: name} object */
export type RRLookupData = Record<string, string>;

export interface RRStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RRTrainMeta {
  number: string;
  name: string;
  type: string;
  category: string;
  source: RRStation;
  destination: RRStation;
  runDays: string[];        // e.g. ["mon","tue",...] or ["daily"]
  distance: number;         // km
  duration: number;         // minutes
  avgSpeed: number;
  maxSpeed: number;
  totalHalts: number;
  returnTrain?: string;
  coachPosition?: string;
}

export interface RRRouteStop {
  sequence: number;
  station: RRStation;
  isHalt: boolean;
  arrival?: string;
  arrivalDay?: number;
  departure?: string;
  departureDay?: number;
  distance: number;
  speedToNextStationKmph?: number;
}

export interface RRTrainDetailData {
  train: RRTrainMeta;
  route: RRRouteStop[];
}

/** One entry in data.route[] from the live endpoint */
export interface RRLiveStop {
  sequence: number;
  stationCode: string;
  stationName: string;
  isHalt: boolean;
  status: string;               // 'departed' | 'at-station' | 'upcoming' | 'arrived'
  scheduledArrival?: string;    // ISO datetime
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  platform?: string;
  distance: number;
  arrivalDay?: number;
  departureDay?: number;
  speedToNextStationKmph?: number;
}

/** Exact top-level shape of /trains/:number/live response data */
export interface RRLiveData {
  // Current position
  currentLocation: {
    stationCode: string;
    stationName: string;
    sequence: number;
    status: string;            // 'at-station' | 'between-stations'
    isHalt: boolean;
    isActualPosition: boolean;
    delayMinutes: number;
  };
  nextHalt: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  } | null;
  previousHalt: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  } | null;
  delayMinutes: number;
  isLive: boolean;
  trackingMode: string;        // 'real-time' | 'scheduled'
  status: string;              // 'running' | 'not-started' | 'arrived'
  lastUpdatedAt: string;       // ISO datetime
  startDate: string;
  trainNumber: string;
  trainName: string;
  route: RRLiveStop[];         // full schedule with actual times
  // These may or may not be present:
  completionPercent?: number;
}

// ─── Public API functions ────────────────────────────────────────────────────

/**
 * Search trains by number or name.
 * Returns filtered entries from the full lookup dict, matching number or name.
 */
export async function rrSearchTrains(query: string): Promise<Array<{ number: string; name: string }>> {
  const data = await rrFetch<RRLookupData>('/lookup/trains');
  const q = query.toLowerCase().trim();

  const entries = Object.entries(data);
  const filtered = entries.filter(([num, name]) =>
    num.includes(q) || name.toLowerCase().includes(q)
  );

  return filtered.slice(0, 20).map(([num, name]) => ({ number: num, name }));
}

/** Get full train schedule + static route */
export async function rrGetTrainDetail(number: string): Promise<RRTrainDetailData> {
  return rrFetch<RRTrainDetailData>(`/trains/${number}`);
}

/** Get live running status for a train */
export async function rrGetLiveStatus(number: string): Promise<RRLiveData> {
  return rrFetch<RRLiveData>(`/trains/${number}/live`);
}
