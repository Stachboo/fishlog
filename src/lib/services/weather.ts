// ── Weather Service ────────────────────────────────────────────────────────
// Aggregates data from:
//   1. OpenWeatherMap (air temp, wind, pressure, humidity, location name)
//   2. Open-Meteo Marine (water temperature)
//   3. suncalc (moon phase, sunrise, sunset)
// Computes fishing score via score.ts.
// Caches results via cache.ts.

import SunCalc from "suncalc";
import { computeFishingScore } from "./score";
import { getCachedWeather, setCachedWeather } from "./cache";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WeatherData {
  airTemp: number;
  waterTemp: number | null;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  humidity: number;
  moonPhase: number;
  sunrise: string;     // HH:MM
  sunset: string;      // HH:MM
  score: number;
  locationName: string;
  updatedAt: string;   // ISO timestamp
}

// ── Internal helpers ───────────────────────────────────────────────────────

function formatHHMM(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

// ── OpenWeatherMap ─────────────────────────────────────────────────────────

interface OWMResponse {
  name: string;
  sys: { country: string };
  main: { temp: number; pressure: number; humidity: number };
  wind: { speed: number; deg: number };
}

async function fetchOWM(lat: number, lon: number): Promise<{
  airTemp: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  humidity: number;
  locationName: string;
}> {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) {
    // Return plausible defaults so the dashboard still renders without the API key
    return {
      airTemp: 18,
      windSpeed: 10,
      windDirection: 180,
      pressure: 1013,
      humidity: 65,
      locationName: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`OpenWeatherMap error ${res.status}`);
  }

  const data: OWMResponse = await res.json();

  return {
    airTemp: Math.round(data.main.temp * 10) / 10,
    windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, // m/s → km/h
    windDirection: data.wind.deg ?? 0,
    pressure: data.main.pressure,
    humidity: data.main.humidity,
    locationName: `${data.name}, ${data.sys.country}`,
  };
}

// ── Open-Meteo Marine ──────────────────────────────────────────────────────

interface MarineResponse {
  current?: {
    sea_surface_temperature?: number | null;
  };
}

async function fetchMarineTemp(lat: number, lon: number): Promise<number | null> {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
      `&current=sea_surface_temperature`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data: MarineResponse = await res.json();
    const sst = data.current?.sea_surface_temperature;
    if (sst == null || isNaN(sst)) return null;
    return Math.round(sst * 10) / 10;
  } catch {
    return null; // inland or API unavailable
  }
}

// ── suncalc ────────────────────────────────────────────────────────────────

function computeSunMoon(lat: number, lon: number, now: Date): {
  moonPhase: number;
  sunrise: string;
  sunset: string;
  sunriseISO: string;
  sunsetISO: string;
} {
  const moon = SunCalc.getMoonIllumination(now);
  const times = SunCalc.getTimes(now, lat, lon);

  return {
    moonPhase: moon.phase,
    sunrise: formatHHMM(times.sunrise),
    sunset: formatHHMM(times.sunset),
    sunriseISO: times.sunrise.toISOString(),
    sunsetISO: times.sunset.toISOString(),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  // 1. Try cache first
  const cached = await getCachedWeather<WeatherData>(lat, lon);
  if (cached) return cached;

  // 2. Fetch all sources in parallel
  const now = new Date();
  const [owm, waterTemp] = await Promise.all([
    fetchOWM(lat, lon),
    fetchMarineTemp(lat, lon),
  ]);

  const { moonPhase, sunrise, sunset, sunriseISO, sunsetISO } = computeSunMoon(
    lat,
    lon,
    now
  );

  // 3. Compute fishing score
  const score = computeFishingScore({
    airTemp: owm.airTemp,
    waterTemp,
    windSpeed: owm.windSpeed,
    pressure: owm.pressure,
    moonPhase,
    sunriseISO,
    sunsetISO,
    nowISO: now.toISOString(),
  });

  const data: WeatherData = {
    airTemp: owm.airTemp,
    waterTemp,
    windSpeed: owm.windSpeed,
    windDirection: owm.windDirection,
    pressure: owm.pressure,
    humidity: owm.humidity,
    moonPhase,
    sunrise,
    sunset,
    score,
    locationName: owm.locationName,
    updatedAt: now.toISOString(),
  };

  // 4. Store in cache (fire and forget)
  setCachedWeather(lat, lon, data).catch(() => {});

  return data;
}
