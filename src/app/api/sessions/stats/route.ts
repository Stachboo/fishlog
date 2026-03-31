// GET /api/sessions/stats — computed stats for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { spots } from "@/lib/db/schema/spots";
import { getCurrentUser } from "@/lib/auth-helpers";
import { withErrorHandler, AuthError } from "@/lib/api/error-handler";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const userId = user.id;

  // All sessions for this user
  const allSessions = await db
    .select({
      id: fishingSessions.id,
      spotId: fishingSessions.spotId,
      date: fishingSessions.date,
      technique: fishingSessions.technique,
      bait: fishingSessions.bait,
      score: fishingSessions.score,
      spotName: spots.name,
    })
    .from(fishingSessions)
    .leftJoin(spots, eq(fishingSessions.spotId, spots.id))
    .where(eq(fishingSessions.userId, userId));

  const totalSessions = allSessions.length;

  if (totalSessions === 0) {
    return NextResponse.json({
      totalSessions: 0,
      bestSpot: null,
      bestHour: null,
      bestTechnique: null,
      bestBait: null,
      avgScore: null,
      monthlyTrend: [],
    });
  }

  // Average score
  const scoredSessions = allSessions.filter((s) => s.score !== null);
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoredSessions.length
        )
      : null;

  // Best spot: spot with highest avg score and minimum 1 session
  const spotMap = new Map<
    string,
    { name: string; scores: number[]; count: number }
  >();
  for (const s of allSessions) {
    if (!s.spotId || !s.spotName) continue;
    const entry = spotMap.get(s.spotId) ?? {
      name: s.spotName,
      scores: [],
      count: 0,
    };
    entry.count++;
    if (s.score !== null) entry.scores.push(s.score);
    spotMap.set(s.spotId, entry);
  }

  let bestSpot: { name: string; avgScore: number; sessionCount: number } | null =
    null;
  for (const entry of spotMap.values()) {
    const avg =
      entry.scores.length > 0
        ? Math.round(
            entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
          )
        : 0;
    if (!bestSpot || avg > bestSpot.avgScore) {
      bestSpot = { name: entry.name, avgScore: avg, sessionCount: entry.count };
    }
  }

  // Best hour: most common hour in session dates
  const hourCount = new Map<string, number>();
  for (const s of allSessions) {
    // Extract hour from date string YYYY-MM-DD — use createdAt hour as proxy
    const dateStr = s.date; // YYYY-MM-DD
    const hour = dateStr.substring(11, 13) || "08"; // fallback
    hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1);
  }
  let bestHour: string | null = null;
  let maxHourCount = 0;
  for (const [h, count] of hourCount) {
    if (count > maxHourCount) {
      maxHourCount = count;
      bestHour = h + "h00";
    }
  }

  // Best technique
  const techniqueMap = new Map<
    string,
    { count: number; scores: number[] }
  >();
  for (const s of allSessions) {
    if (!s.technique) continue;
    const entry = techniqueMap.get(s.technique) ?? { count: 0, scores: [] };
    entry.count++;
    if (s.score !== null) entry.scores.push(s.score);
    techniqueMap.set(s.technique, entry);
  }

  let bestTechnique: { name: string; count: number; avgScore: number } | null =
    null;
  for (const [name, entry] of techniqueMap) {
    const avg =
      entry.scores.length > 0
        ? Math.round(
            entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
          )
        : 0;
    if (!bestTechnique || entry.count > bestTechnique.count) {
      bestTechnique = { name, count: entry.count, avgScore: avg };
    }
  }

  // Best bait
  const baitMap = new Map<string, { count: number; scores: number[] }>();
  for (const s of allSessions) {
    if (!s.bait) continue;
    const entry = baitMap.get(s.bait) ?? { count: 0, scores: [] };
    entry.count++;
    if (s.score !== null) entry.scores.push(s.score);
    baitMap.set(s.bait, entry);
  }

  let bestBait: { name: string; count: number; avgScore: number } | null = null;
  for (const [name, entry] of baitMap) {
    const avg =
      entry.scores.length > 0
        ? Math.round(
            entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length
          )
        : 0;
    if (!bestBait || entry.count > bestBait.count) {
      bestBait = { name, count: entry.count, avgScore: avg };
    }
  }

  // Monthly trend: last 6 months
  const monthMap = new Map<
    string,
    { totalScore: number; count: number; scoredCount: number }
  >();
  for (const s of allSessions) {
    const month = s.date.substring(0, 7); // YYYY-MM
    const entry = monthMap.get(month) ?? {
      totalScore: 0,
      count: 0,
      scoredCount: 0,
    };
    entry.count++;
    if (s.score !== null) {
      entry.totalScore += s.score;
      entry.scoredCount++;
    }
    monthMap.set(month, entry);
  }

  const monthlyTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, entry]) => ({
      month,
      avgScore:
        entry.scoredCount > 0
          ? Math.round(entry.totalScore / entry.scoredCount)
          : 0,
      count: entry.count,
    }));

  return NextResponse.json({
    totalSessions,
    bestSpot,
    bestHour,
    bestTechnique,
    bestBait,
    avgScore,
    monthlyTrend,
  });
});
