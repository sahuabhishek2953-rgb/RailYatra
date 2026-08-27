/**
 * Hybrid cache: tries Redis first, falls back to in-memory LRU.
 * This ensures caching works even without a running Redis server.
 */
import Redis from 'ioredis';

// ─── Simple in-memory LRU ─────────────────────────────────────────────────────
interface CacheEntry<T> { value: T; expiresAt: number }
const memCache = new Map<string, CacheEntry<any>>();
const MEM_MAX = 500;

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
  return entry.value as T;
}

function memSet<T>(key: string, value: T, ttlSeconds: number): void {
  // Evict oldest if over capacity
  if (memCache.size >= MEM_MAX) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ─── Redis + mem hybrid ───────────────────────────────────────────────────────
class CacheService {
  private redis: Redis | null = null;
  private redisOk = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) return;
    try {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
      this.redis.on('connect', () => { this.redisOk = true; console.log('[Cache] Redis connected'); });
      this.redis.on('error', () => { this.redisOk = false; });
    } catch { /* no redis */ }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.redis && this.redisOk) {
      try {
        const raw = await this.redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch { /* fall through */ }
    }
    // Fallback to memory
    return memGet<T>(key);
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    // Write to memory always (instant, reliable)
    memSet(key, value, ttlSeconds);
    // Also write to Redis if available
    if (this.redis && this.redisOk) {
      try { await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch { /* ok */ }
    }
  }

  async del(key: string): Promise<void> {
    memCache.delete(key);
    if (this.redis && this.redisOk) {
      try { await this.redis.del(key); } catch { /* ok */ }
    }
  }
}

export const redisCache = new CacheService();
