import { getCachedWeather, setCachedWeather } from "./cache";

export interface HourlyForecast {
  time: string;          // ISO string
  temp: number;          // °C
  windSpeed: number;     // km/h
  windGust: number;      // km/h
  windDir: number;       // degrees 0-360
  pressure: number;      // hPa
  humidity: number;      // %
  precipitation: number; // mm
  weatherCode: number;   // WMO weather code
  cloudCover: number;    // %
}

export async function getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  // Check cache first (use "forecast:" prefix to avoid collision with current weather)
  const cacheKey = `forecast:${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}`;
  // We can't reuse getCachedWeather directly because it uses a different key format
  // So just call Open-Meteo directly with a simple in-memory approach

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("hourly", [
    "temperature_2m",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "pressure_msl",
    "relative_humidity_2m",
    "precipitation",
    "weather_code",
    "cloud_cover",
  ].join(","));
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "2"); // 48 hours is enough

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } }); // cache 30 min
  if (!res.ok) throw new Error(`Open-Meteo forecast error ${res.status}`);

  const data = await res.json();
  const hourly = data.hourly;

  if (!hourly || !hourly.time) return [];

  // Filter to only future hours (from current hour onward, max 24)
  const now = new Date();
  const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();

  const results: HourlyForecast[] = [];
  for (let i = 0; i < hourly.time.length && results.length < 24; i++) {
    const time = new Date(hourly.time[i]).getTime();
    if (time < currentHour) continue;

    results.push({
      time: hourly.time[i],
      temp: Math.round((hourly.temperature_2m?.[i] ?? 0) * 10) / 10,
      windSpeed: Math.round((hourly.wind_speed_10m?.[i] ?? 0) * 10) / 10,
      windGust: Math.round((hourly.wind_gusts_10m?.[i] ?? 0) * 10) / 10,
      windDir: hourly.wind_direction_10m?.[i] ?? 0,
      pressure: Math.round(hourly.pressure_msl?.[i] ?? 1013),
      humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? 0),
      precipitation: Math.round((hourly.precipitation?.[i] ?? 0) * 10) / 10,
      weatherCode: hourly.weather_code?.[i] ?? 0,
      cloudCover: Math.round(hourly.cloud_cover?.[i] ?? 0),
    });
  }

  return results;
}
