import { SharedJourneySnapshot } from '@railyatra/types';
import { JourneyService } from './journey.service';
import { redisCache } from '../lib/redis';
import { randomBytes } from 'crypto';

// In-memory fallback if Redis is unavailable
const memStore = new Map<string, SharedJourneySnapshot>();

export class SharingService {
  static async createShareToken(trainId: string): Promise<string> {
    const journey = await JourneyService.getJourneyDetails(trainId);
    if (!journey) throw new Error(`Train journey not found for train: ${trainId}`);

    const token = randomBytes(16).toString('hex'); // 32-char secure token
    const snapshot: SharedJourneySnapshot = {
      token,
      train: journey.train,
      liveStatus: journey.liveStatus,
      route: journey.route,
      timeline: journey.timeline,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days
    };

    memStore.set(token, snapshot);
    await redisCache.set(`share:${token}`, snapshot, 86400 * 7);
    return token;
  }

  static async getSharedJourney(token: string): Promise<SharedJourneySnapshot | null> {
    const cached = await redisCache.get<SharedJourneySnapshot>(`share:${token}`);
    if (cached) return cached;
    return memStore.get(token) ?? null;
  }
}
