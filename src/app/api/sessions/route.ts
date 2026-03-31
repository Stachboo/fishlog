// GET /api/sessions — list user's sessions (paginated)
// POST /api/sessions — create a new fishing session

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { spots } from "@/lib/db/schema/spots";
import { getCurrentUser, requireAuth } from "@/lib/auth-helpers";
import { withErrorHandler, AuthError, NotFoundError } from "@/lib/api/error-handler";
import { createSessionSchema } from "@/lib/validations/session";
import { getWeather } from "@/lib/services/weather";

const PAGE_SIZE = 20;

// ── GET /api/sessions ──────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const spotId = searchParams.get("spotId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const conditions = [eq(fishingSessions.userId, user.id)];
  if (spotId) conditions.push(eq(fishingSessions.spotId, spotId));
  if (dateFrom) conditions.push(gte(fishingSessions.date, dateFrom));
  if (dateTo) conditions.push(lte(fishingSessions.date, dateTo));

  const rows = await db
    .select({
      id: fishingSessions.id,
      userId: fishingSessions.userId,
      spotId: fishingSessions.spotId,
      date: fishingSessions.date,
      technique: fishingSessions.technique,
      bait: fishingSessions.bait,
      notes: fishingSessions.notes,
      weatherData: fishingSessions.weatherData,
      score: fishingSessions.score,
      createdAt: fishingSessions.createdAt,
      updatedAt: fishingSessions.updatedAt,
      spotName: spots.name,
    })
    .from(fishingSessions)
    .leftJoin(spots, eq(fishingSessions.spotId, spots.id))
    .where(and(...conditions))
    .orderBy(desc(fishingSessions.date), desc(fishingSessions.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return NextResponse.json({ sessions: rows, page, pageSize: PAGE_SIZE });
});

// ── POST /api/sessions ─────────────────────────────────────────────────────

// Simple in-memory debounce store: "userId:spotId:date" → timestamp
const recentCreations = new Map<string, number>();

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();

  const json = await req.json();
  const body = createSessionSchema.parse(json);

  // Debounce: reject if same user+spot+date within 60 seconds
  const debounceKey = `${user.id}:${body.spotId ?? "none"}:${body.date}`;
  const lastCreated = recentCreations.get(debounceKey);
  if (lastCreated && Date.now() - lastCreated < 60_000) {
    return NextResponse.json(
      { error: "Duplicate session detected. Please wait before creating another.", code: "DEBOUNCE" },
      { status: 429 }
    );
  }

  // Auto-fetch weather if spot is provided
  let weatherData = body.weatherData ?? null;
  let score = body.score ?? null;

  if (body.spotId) {
    const spot = await db
      .select({ latitude: spots.latitude, longitude: spots.longitude })
      .from(spots)
      .where(and(eq(spots.id, body.spotId), eq(spots.userId, user.id)))
      .limit(1);

    if (!spot.length) throw new NotFoundError("Spot not found");

    try {
      const weather = await getWeather(spot[0].latitude, spot[0].longitude);
      weatherData = weather as unknown as Record<string, unknown>;
      score = weather.score;
    } catch {
      // Non-fatal: proceed without weather
    }
  }

  // Record debounce timestamp
  recentCreations.set(debounceKey, Date.now());
  // Clean up old entries every 100 inserts
  if (recentCreations.size > 100) {
    const cutoff = Date.now() - 60_000;
    for (const [k, v] of recentCreations) {
      if (v < cutoff) recentCreations.delete(k);
    }
  }

  const [session] = await db
    .insert(fishingSessions)
    .values({
      userId: user.id,
      spotId: body.spotId ?? null,
      date: body.date,
      technique: body.technique ?? null,
      bait: body.bait ?? null,
      notes: body.notes ?? null,
      weatherData: (weatherData as Record<string, unknown>) ?? null,
      score: score ?? null,
    })
    .returning();

  return NextResponse.json({ session }, { status: 201 });
});
