import { WeatherCondition } from '@railyatra/types';
import { redisCache } from '../lib/redis';

export class WeatherService {
  static async getWeather(lat: number, lng: number): Promise<WeatherCondition> {
    const cacheKey = `weather:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const cached = await redisCache.get<WeatherCondition>(cacheKey);
    if (cached) return cached;

    // Read lazily — after dotenv.config() has run
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);

        if (response.ok) {
          const data: any = await response.json();
          const weather: WeatherCondition = {
            locationName: data.name || 'Station Area',
            stationCode: 'LOC',
            temperatureC: Math.round(data.main.temp),
            feelsLikeC: Math.round(data.main.feels_like),
            humidityPercent: data.main.humidity,
            windSpeedKmh: Math.round((data.wind?.speed ?? 0) * 3.6),
            condition: data.weather?.[0]?.main ?? 'Clear',
            icon: data.weather?.[0]?.icon ?? '01d',
            rainForecastMm: data.rain ? (data.rain['1h'] ?? 0) : 0,
            isAvailable: true
          };
          await redisCache.set(cacheKey, weather, 600); // 10 min
          return weather;
        }

        console.error(`[OpenWeather] Status ${response.status} for lat=${lat} lng=${lng}`);
      } catch (err) {
        console.error('[OpenWeather] Fetch error:', err);
      }
    }

    // Graceful fallback — return unavailable state, not an error
    const unavailable: WeatherCondition = {
      locationName: 'Station Area',
      stationCode: '',
      temperatureC: 0,
      feelsLikeC: 0,
      humidityPercent: 0,
      windSpeedKmh: 0,
      condition: 'Unavailable',
      icon: '',
      rainForecastMm: 0,
      isAvailable: false
    };
    return unavailable;
  }
}
