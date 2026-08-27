import { Train } from '@railyatra/types';
import { rrSearchTrains } from '../providers/railradar.provider';
import { redisCache } from '../lib/redis';

export class TrainService {
  static async searchTrains(query: string): Promise<Train[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const cacheKey = `search:${q.toLowerCase()}`;

    const cached = await redisCache.get<Train[]>(cacheKey);
    if (cached) return cached;

    const results = await rrSearchTrains(q);

    const trains: Train[] = results.map(r => ({
      id: r.number,
      number: r.number,
      name: r.name,
      type: 'Express',
      sourceStationId: '',
      destStationId: '',
      sourceStation: { id: '', code: '', name: '', lat: 20.5937, lng: 78.9629 },
      destStation: { id: '', code: '', name: '', lat: 20.5937, lng: 78.9629 },
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      stopsCount: 0
    }));

    await redisCache.set(cacheKey, trains, 300);
    return trains;
  }
}
