import { redisCache } from '../lib/redis';

export class OpenTopographyProvider {
  private static apiKey = process.env.OPENTOPOGRAPHY_API_KEY || '6242d0b894d1d57f22a811fcf4c46d48';

  static async getElevation(lat: number, lng: number): Promise<number> {
    const cacheKey = `elevation:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const cached = await redisCache.get<number>(cacheKey);
    if (cached !== null) return cached;

    if (this.apiKey) {
      try {
        const response = await fetch(
          `https://api.opentopography.org/v1/globaldem?demtype=SRTMGL1&south=${lat - 0.01}&north=${lat + 0.01}&west=${lng - 0.01}&east=${lng + 0.01}&outputFormat=json&API_Key=${this.apiKey}`
        );
        if (response.ok) {
          const json: any = await response.json();
          if (json && json.elevation) {
            const elevation = Number(json.elevation);
            await redisCache.set(cacheKey, elevation, 86400 * 30);
            return elevation;
          }
        }
      } catch {
        // Fallback to estimated elevation
      }
    }

    const estimated = 450 + Math.round(Math.sin(lat + lng) * 150);
    await redisCache.set(cacheKey, estimated, 86400 * 30);
    return estimated;
  }
}
