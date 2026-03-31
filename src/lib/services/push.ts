// Push notification service using web-push + VAPID

import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions, spots } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// ── VAPID configuration ────────────────────────────────────────────────────

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_MAILTO = "mailto:contact@fishlog.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// ── Core helpers ───────────────────────────────────────────────────────────

/**
 * Send a push notification to a single subscription.
 * Silently removes the subscription record if it has expired (410).
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("VAPID keys not configured — skipping push");
    return;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      // Subscription expired — remove it
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    } else {
      throw err;
    }
  }
}

// Haversine distance in km
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Notify all subscribers who have spots within radiusKm of (lat, lon).
 */
export async function notifyZone(
  lat: number,
  lon: number,
  radiusKm: number,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return;
  }

  // Find spots within rough bounding box first (fast), then filter by haversine
  const allSpots = await db.query.spots.findMany({
    columns: { id: true, userId: true, latitude: true, longitude: true },
  });

  const nearbyUserIds = [
    ...new Set(
      allSpots
        .filter(
          (s) => haversineKm(lat, lon, s.latitude, s.longitude) <= radiusKm
        )
        .map((s) => s.userId)
    ),
  ];

  if (nearbyUserIds.length === 0) return;

  const subs = await db.query.pushSubscriptions.findMany({
    where: (ps, { inArray: inArr }) => inArr(ps.userId, nearbyUserIds),
  });

  await Promise.allSettled(
    subs.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );
}
