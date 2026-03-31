// GET /api/spots/compare?ids=uuid1,uuid2,uuid3
// Compare 2-3 spots: current weather + historical stats

import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { spots } from "@/lib/db/schema/spots";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { getCurrentUser } from "@/lib/auth-helpers";
import { withErrorHandler, AuthError } from "@/lib/api/error-handler";
import { getWeather } from "@/lib/services/weather";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length < 2) {
    return NextResponse.json(
      { error: "At least 2 spot IDs required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Fetch spots owned by user
  const userSpots = await db
    .select()
    .from(spots)
    .where(and(inArray(spots.id, ids), eq(spots.userId, user.id)));

  if (userSpots.length < 2) {
    return NextResponse.json(
      { error: "Could not find 2 or more spots", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  // Fetch historical sessions for these spots
  const sessionRows = await db
    .select({
      spotId: fishingSessions.spotId,
      technique: fishingSessions.technique,
      score: fishingSessions.score,
    })
    .from(fishingSessions)
    .where(
      and(
        eq(fishingSessions.userId, user.id),
        inArray(fishingSessions.spotId, userSpots.map((s) => s.id))
      )
    );

  // Fetch current weather for each spot in parallel
  const weatherResults = await Promise.all(
    userSpots.map((spot) =>
      getWeather(spot.latitude, spot.longitude).catch(() => null)
    )
  );

  // Compute stats per spot
  const results = userSpots.map((spot, i) => {
    const sessions = sessionRows.filter((s) => s.spotId === spot.id);
    const scoredSessions = sessions.filter((s) => s.score !== null);

    const avgScore =
      scoredSessions.length > 0
        ? Math.round(
            scoredSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              scoredSessions.length
          )
        : null;

    // Best technique
    const techniqueCount = new Map<string, number>();
    for (const s of sessions) {
      if (!s.technique) continue;
      techniqueCount.set(s.technique, (techniqueCount.get(s.technique) ?? 0) + 1);
    }
    let bestTechnique: string | null = null;
    let maxCount = 0;
    for (const [name, count] of techniqueCount) {
      if (count > maxCount) {
        maxCount = count;
        bestTechnique = name;
      }
    }

    return {
      spot: {
        id: spot.id,
        name: spot.name,
        latitude: spot.latitude,
        longitude: spot.longitude,
      },
      weather: weatherResults[i],
      stats: {
        sessionCount: sessions.length,
        avgScore,
        bestTechnique,
      },
    };
  });

  // Recommendation: spot with highest current weather score
  const recommendation = results
    .filter((r) => r.weather !== null)
    .sort((a, b) => (b.weather?.score ?? 0) - (a.weather?.score ?? 0))[0]
    ?.spot.id ?? null;

  return NextResponse.json({ results, recommendation });
});
