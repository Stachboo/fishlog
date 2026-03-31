// ── Redis Cache (Upstash) ──────────────────────────────────────────────────
// Wraps @upstash/redis with a graceful fallback when env vars are missing.

import { Redis } from "@upstash/redis";

// TTL: 30 minutes
const WEATHER_TTL = 1800;

/** Round lat/lon to 1 decimal (≈11 km zones) for cache key granularity */
function zoneKey(lat: number, lon: number): string {
  const zLat = Math.round(lat * 10) / 10;
  const zLon = Math.round(lon * 10) / 10;
  return `weather:${zLat}:${zLon}`;
}

// Lazily instantiate Redis only when env vars are present
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    redis = new Redis({ url, token });
    return redis;
  } catch {
    return null;
  }
}

export async function getCachedWeather<T>(lat: number, lon: number): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const key = zoneKey(lat, lon);
    return await client.get<T>(key);
  } catch {
    return null; // cache miss — fetch fresh
  }
}

export async function setCachedWeather<T>(lat: number, lon: number, data: T): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const key = zoneKey(lat, lon);
    await client.set(key, data, { ex: WEATHER_TTL });
  } catch {
    // non-fatal — continue without cache
  }
}
