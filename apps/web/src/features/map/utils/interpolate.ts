import * as turf from '@turf/turf';
import { RouteGeoJSON, TrainLocation } from '@railyatra/types';

export function calculateSmoothedLocation(
  route: RouteGeoJSON,
  currentLocation: TrainLocation,
  completionPercent: number
): { lat: number; lng: number; heading: number } {
  try {
    const lineFeature = route.features[0];
    if (!lineFeature || !lineFeature.geometry || lineFeature.geometry.coordinates.length < 2) {
      return { lat: currentLocation.lat, lng: currentLocation.lng, heading: currentLocation.heading };
    }

    const line = turf.lineString(lineFeature.geometry.coordinates);
    const totalDistance = turf.length(line, { units: 'kilometers' });
    const distanceAlong = totalDistance * (completionPercent / 100);

    const point = turf.along(line, distanceAlong, { units: 'kilometers' });
    const coords = point.geometry.coordinates;

    // Calculate heading/bearing for next 0.5km along route
    const nextPoint = turf.along(line, Math.min(totalDistance, distanceAlong + 0.5), { units: 'kilometers' });
    const bearing = turf.bearing(point, nextPoint);

    return {
      lng: coords[0],
      lat: coords[1],
      heading: (bearing + 360) % 360
    };
  } catch {
    return { lat: currentLocation.lat, lng: currentLocation.lng, heading: currentLocation.heading };
  }
}
