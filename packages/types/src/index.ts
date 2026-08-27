export interface Station {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  state?: string;
  zone?: string;
}

export interface TrainStop {
  id: string;
  trainId: string;
  stationId: string;
  station: Station;
  stopNumber: number;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  dayNumber: number;
  distanceFromSourceKm: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: string;
  sourceStationId: string;
  destStationId: string;
  sourceStation: Station;
  destStation: Station;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  stopsCount: number;
}

export interface TrainLocation {
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  timestamp: string;
}

export interface LiveStatus {
  trainId: string;
  journeyId: string;
  currentStationId: string;
  currentStation: Station;
  nextStationId: string | null;
  nextStation: Station | null;
  status: 'ON_TIME' | 'DELAYED' | 'ARRIVED' | 'CANCELLED';
  delayMinutes: number;
  eta: string;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  journeyCompletionPercent: number;
  lastUpdated: string;
  location: TrainLocation;
  hasLiveGps: boolean;
}

export interface StationEvent {
  stationId: string;
  station: Station;
  scheduledArrival: string | null;
  actualArrival: string | null;
  scheduledDeparture: string | null;
  actualDeparture: string | null;
  delayMinutes: number;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING';
  platform?: string;
}

export interface RouteGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    properties: {
      trainId: string;
      source: string;
      destination: string;
    };
  }>;
}

export interface JourneyAnalytics {
  completionPercent: number;
  distanceTravelledKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  currentDelayMinutes: number;
  stationsCompletedCount: number;
  totalStationsCount: number;
  highestElevationMeters: number;
  statesCrossed: string[];
  lastUpdated: string;
}

export interface WeatherCondition {
  locationName: string;
  stationCode: string;
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  condition: string;
  icon: string;
  rainForecastMm: number;
  isAvailable: boolean;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'RIVER' | 'LAKE' | 'MOUNTAIN' | 'BRIDGE' | 'TUNNEL' | 'CITY' | 'DISTRICT' | 'MONUMENT' | 'ATTRACTION';
  lat: number;
  lng: number;
  distanceFromTrainKm: number;
  description?: string;
  wikipediaUrl?: string;
}

export interface JourneyDetails {
  train: Train;
  liveStatus: LiveStatus;
  route: RouteGeoJSON;
  timeline: StationEvent[];
  analytics: JourneyAnalytics;
}

export interface SharedJourneySnapshot {
  token: string;
  train: Train;
  liveStatus: LiveStatus;
  route: RouteGeoJSON;
  timeline: StationEvent[];
  createdAt: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId: string;
  };
}
