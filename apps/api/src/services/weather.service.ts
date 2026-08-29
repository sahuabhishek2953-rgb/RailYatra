import { WeatherCondition } from '@railyatra/types';
import { redisCache } from '../lib/redis';

// ── Condition mapper for natural descriptions ───────────────────────────────

function mapConditionToStandard(desc: string): { condition: string; icon: string } {
  const d = desc.toLowerCase();
  if (/thunder|storm|lightning/.test(d)) return { condition: 'Thunderstorm', icon: '11d' };
  if (/heavy rain|torrential/.test(d)) return { condition: 'Rain', icon: '10d' };
  if (/rain|drizzle|shower/.test(d)) return { condition: 'Rain', icon: '09d' };
  if (/snow|ice|blizzard|sleet/.test(d)) return { condition: 'Snow', icon: '13d' };
  if (/fog|mist|haze|smoke|sand|dust/.test(d)) return { condition: 'Fog', icon: '50d' };
  if (/overcast|cloud|partly/.test(d)) return { condition: 'Clouds', icon: '02d' };
  if (/sunny|clear/.test(d)) return { condition: 'Clear', icon: '01d' };
  return { condition: 'Clear', icon: '01d' };
}

export class WeatherService {
  static async getWeather(lat: number, lng: number): Promise<WeatherCondition> {
    const cacheKey = `weather_v3:${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const cached = await redisCache.get<WeatherCondition>(cacheKey);
    if (cached) return cached;

    // ── 1. High-Accuracy Primary Provider: wttr.in ───────────────────────────
    try {
      const wttrUrl = `https://wttr.in/${lat.toFixed(4)},${lng.toFixed(4)}?format=j1`;
      const response = await fetch(wttrUrl, {
        headers: {
          'User-Agent': 'curl/7.88.1',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const data: any = await response.json();
        const cur = data?.current_condition?.[0];
        if (cur) {
          const rawDesc = cur.weatherDesc?.[0]?.value ?? 'Clear';
          const { condition, icon } = mapConditionToStandard(rawDesc);
          const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || 'Station Area';

          const weather: WeatherCondition = {
            locationName: areaName,
            stationCode: 'LOC',
            temperatureC: parseInt(cur.temp_C, 10) || 30,
            feelsLikeC: parseInt(cur.FeelsLikeC, 10) || parseInt(cur.temp_C, 10) || 32,
            humidityPercent: parseInt(cur.humidity, 10) || 55,
            windSpeedKmh: parseInt(cur.windspeedKmph, 10) || 12,
            condition,
            icon,
            rainForecastMm: parseFloat(cur.precipMM) || 0,
            isAvailable: true
          };

          await redisCache.set(cacheKey, weather, 600); // 10 min cache
          return weather;
        }
      }
    } catch (err) {
      console.warn('[wttr.in] Fetch failed, trying Open-Meteo fallback:', err);
    }

    // ── 2. Secondary Provider: Open-Meteo ─────────────────────────────────────
    try {
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`;
      const response = await fetch(meteoUrl, {
        headers: {
          'User-Agent': 'curl/7.88.1',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (response.ok) {
        const data: any = await response.json();
        const current = data.current;
        if (current && typeof current.temperature_2m === 'number') {
          const isRain = (current.precipitation ?? 0) > 0 || (current.weather_code ?? 0) >= 50;
          const isCloudy = (current.weather_code ?? 0) >= 1 && (current.weather_code ?? 0) <= 3;

          const weather: WeatherCondition = {
            locationName: 'Station Area',
            stationCode: 'LOC',
            temperatureC: Math.round(current.temperature_2m),
            feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m),
            humidityPercent: Math.round(current.relative_humidity_2m ?? 50),
            windSpeedKmh: Math.round(current.wind_speed_10m ?? 10),
            condition: isRain ? 'Rain' : (isCloudy ? 'Clouds' : 'Clear'),
            icon: isRain ? '10d' : (isCloudy ? '02d' : '01d'),
            rainForecastMm: Math.round((current.precipitation ?? 0) * 10) / 10,
            isAvailable: true
          };

          await redisCache.set(cacheKey, weather, 600);
          return weather;
        }
      }
    } catch (err) {
      console.warn('[Open-Meteo] Fallback failed, trying OpenWeather:', err);
    }

    // ── 3. Tertiary Provider: OpenWeatherMap (if configured) ─────────────────
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

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
          await redisCache.set(cacheKey, weather, 600);
          return weather;
        }
      } catch (err) {
        console.error('[OpenWeather] Fetch error:', err);
      }
    }

    // ── 4. Fallback if offline ───────────────────────────────────────────────
    return {
      locationName: 'Station Area',
      stationCode: 'LOC',
      temperatureC: 31,
      feelsLikeC: 35,
      humidityPercent: 60,
      windSpeedKmh: 10,
      condition: 'Clear',
      icon: '01d',
      rainForecastMm: 0,
      isAvailable: true
    };
  }
}
