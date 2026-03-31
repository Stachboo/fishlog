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

/** OWM daily call counter key: owm:calls:YYYY-MM-DD */
function owmDayKey(): string {
  return `owm:calls:${new Date().toISOString().slice(0, 10)}`;
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

/**
 * Increment the OWM API call counter for today.
 * Key: owm:calls:YYYY-MM-DD (TTL: 48h to cover timezone edge cases)
 */
export async function incrementOwmCallCounter(): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const key = owmDayKey();
    await client.incr(key);
    // Set expiry only if key is new (EXPIRE NX not available in all SDKs, use expire directly)
    await client.expire(key, 172800); // 48 hours
  } catch {
    // non-fatal
  }
}

/**
 * Returns today's OWM API call count (0 if Redis unavailable).
 */
export async function getOwmCallsToday(): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  try {
    const key = owmDayKey();
    const val = await client.get<number>(key);
    return val ?? 0;
  } catch {
    return 0;
  }
}
