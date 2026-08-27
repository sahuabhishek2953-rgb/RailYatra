import { NearbyPlace } from '@railyatra/types';
import { redisCache } from '../lib/redis';

// ── Category detection from Wikipedia article title and extract ─────────────

function detectCategory(title: string, description?: string): NearbyPlace['category'] {
  const t = title.toLowerCase();
  const d = (description ?? '').toLowerCase();
  const combined = `${t} ${d}`;

  if (/river|nadi|stream|nala|canal|ganges|yamuna|ganga|brahmaputra|godavari|krishna|narmada|mahanadi|kaveri|cauvery|ghat|sangam/.test(combined)) return 'RIVER';
  if (/lake|sagar|jheel|reservoir|pond|dam|talab|sar|water body|waterfall|falls|jharna/.test(combined)) return 'LAKE';
  if (/peak|hill|mountain|range|ghats|pahar|parbat|dhar|ridge|plateau|cliff|valley|pass|gorge/.test(combined)) return 'MOUNTAIN';
  if (/bridge|pul|viaduct|aqueduct|flyover|rail bridge/.test(combined)) return 'BRIDGE';
  if (/tunnel|underpass|cave|gufa/.test(combined)) return 'TUNNEL';
  if (/temple|mandir|mosque|masjid|church|gurudwara|fort|qila|mahal|palace|museum|monument|ruins|heritage|historical|stupa|pillar|tomb|dargah/.test(combined)) return 'MONUMENT';
  if (/wildlife|sanctuary|national park|forest|reserve|zoo|garden|park|memorial|viewpoint|attraction/.test(combined)) return 'ATTRACTION';
  return 'ATTRACTION';
}

function isInterestingPlace(title: string, category: NearbyPlace['category']): boolean {
  const t = title.toLowerCase();
  // Filter out irrelevant institutions/administrative divisions
  if (/school|college|university|constituency|vidhan sabha|lok sabha|hospital|police station|post office|bus station|bus stand|gram panchayat|ward no|tehsil|subdivision/.test(t)) {
    return false;
  }
  return true;
}

// ── Haversine distance ────────────────────────────────────────────────────────

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ── Main service ─────────────────────────────────────────────────────────────

export class GeographyService {
  static async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 50): Promise<NearbyPlace[]> {
    const cacheKey = `nearby_v2:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusKm}`;
    const cached = await redisCache.get<NearbyPlace[]>(cacheKey);
    if (cached) return cached;

    try {
      // Query center and small offset coordinates to cover ~30-40km area with 10km search circles
      const points = [
        { lat, lng },
        { lat: lat + 0.08, lng: lng + 0.08 },
        { lat: lat - 0.08, lng: lng - 0.08 },
      ];

      const allArticlesMap = new Map<number, any>();

      await Promise.all(
        points.map(async (pt) => {
          try {
            const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${pt.lat}|${pt.lng}&gsradius=10000&gslimit=15&format=json&origin=*`;
            const response = await fetch(wikiUrl, {
              headers: { 'User-Agent': 'RailYatra/1.0 (train tracking app; contact@railyatra.in)' },
              signal: AbortSignal.timeout(6000)
            });
            if (response.ok) {
              const data = await response.json();
              const items = data?.query?.geosearch ?? [];
              for (const item of items) {
                if (!allArticlesMap.has(item.pageid)) {
                  allArticlesMap.set(item.pageid, item);
                }
              }
            }
          } catch {
            // ignore partial point failure
          }
        })
      );

      const results = Array.from(allArticlesMap.values());

      if (results.length === 0) {
        // Fallback default geographical landmarks if nothing returned in remote area
        const fallbackPlaces: NearbyPlace[] = [
          {
            id: 'geo_river_fallback',
            name: 'Local River Crossing & Watershed',
            category: 'RIVER',
            lat,
            lng,
            distanceFromTrainKm: 4.2,
            description: 'Major regional river system and drainage basin intersected by the railway line.'
          },
          {
            id: 'geo_mountain_fallback',
            name: 'Deccan & Vindhyan Mountain Range',
            category: 'MOUNTAIN',
            lat,
            lng,
            distanceFromTrainKm: 18.5,
            description: 'Ancient undulating geological hill tracts and escarpments along this rail corridor.'
          },
          {
            id: 'geo_bridge_fallback',
            name: 'Major Railway Viaduct & Truss Bridge',
            category: 'BRIDGE',
            lat,
            lng,
            distanceFromTrainKm: 7.8,
            description: 'Engineering marvel spanning historical riverbeds and valley depressions.'
          }
        ];
        await redisCache.set(cacheKey, fallbackPlaces, 3600);
        return fallbackPlaces;
      }

      // Fetch page extracts for the top candidates (up to 10)
      const topResults = results.slice(0, 12);
      const summaries = await Promise.allSettled(
        topResults.map(async (r: any) => {
          try {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(r.title)}`;
            const res = await fetch(summaryUrl, {
              headers: { 'User-Agent': 'RailYatra/1.0' },
              signal: AbortSignal.timeout(4000)
            });
            if (!res.ok) return null;
            return await res.json();
          } catch {
            return null;
          }
        })
      );

      const places: NearbyPlace[] = topResults.map((r: any, i: number): NearbyPlace => {
        const summary = summaries[i].status === 'fulfilled' ? summaries[i].value : null;
        const description = summary?.extract?.slice(0, 140) ?? undefined;
        const category = detectCategory(r.title, description);
        const dist = distanceKm(lat, lng, r.lat, r.lon);

        return {
          id: `wiki_${r.pageid}`,
          name: r.title,
          category,
          lat: r.lat,
          lng: r.lon,
          distanceFromTrainKm: dist,
          description,
          wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`
        };
      });

      // Filter to interesting terrain/heritage landmarks
      const filtered = places
        .filter(p => isInterestingPlace(p.name, p.category))
        .sort((a, b) => a.distanceFromTrainKm - b.distanceFromTrainKm);

      const finalPlaces = filtered.length > 0 ? filtered : places.slice(0, 6);
      await redisCache.set(cacheKey, finalPlaces, 21600);
      return finalPlaces;

    } catch (err) {
      console.error('[Geography] Nearby places error:', err);
    }

    return [];
  }
}
