// GET /api/reports?lat=&lon=&radius=
// Returns recent community reports in a geographic zone (non-expired).
// POST /api/reports
// Create a new community report (expires after 6 hours).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { communityReports } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { withErrorHandler } from "@/lib/api/error-handler";
import { createReportSchema } from "@/lib/validations/report";
import { triggerAlerts } from "@/lib/services/alerts";
import { gt, and } from "drizzle-orm";

// ── Haversine distance helper (returns km) ────────────────────────────────

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

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(20),
});

// ── GET ────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAuth();

  const { searchParams } = new URL(req.url);
  const { lat, lon, radius } = querySchema.parse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    radius: searchParams.get("radius") ?? 20,
  });

  const now = new Date();

  // Fetch all non-expired reports from DB then filter by distance in JS
  // (Postgres doesn't have native haversine without PostGIS)
  const rows = await db.query.communityReports.findMany({
    where: gt(communityReports.expiresAt, now),
    with: {
      spot: { columns: { name: true } },
      user: { columns: { name: true } },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  const filtered = rows.filter(
    (r) => haversineKm(lat, lon, r.latitude, r.longitude) <= radius
  );

  return NextResponse.json(filtered);
});

// ── POST ───────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const body = await req.json();
  const data = createReportSchema.parse(body);

  // Verify spot belongs to the user (or is public)
  const spot = await db.query.spots.findFirst({
    where: (s, { eq, or }) =>
      and(
        eq(s.id, data.spotId),
        or(eq(s.userId, user.id), eq(s.isPublic, true))
      ),
  });

  if (!spot) {
    return NextResponse.json({ error: "Spot not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // +6 hours

  const [report] = await db
    .insert(communityReports)
    .values({
      userId: user.id,
      spotId: data.spotId,
      reportType: data.reportType,
      message: data.message ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      expiresAt,
    })
    .returning();

  // Trigger push notifications asynchronously (fire and forget)
  triggerAlerts(report, spot.name).catch((err) => {
    console.error("Alert trigger failed:", err);
  });

  return NextResponse.json(report, { status: 201 });
});
