// ── Admin Stats API ────────────────────────────────────────────────────────
// GET /api/admin/stats — returns dashboard metrics for the admin panel.
// Protected: admin only.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/error-handler";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { spots } from "@/lib/db/schema/spots";
import { getOwmCallsToday } from "@/lib/services/cache";
import { sql, gte, and } from "drizzle-orm";

const OWM_DAILY_BUDGET = 1000; // Free tier cap

const handler = withErrorHandler(async (_req: NextRequest) => {
  await requireAdmin();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Date boundaries
  const startOfDay = new Date(todayStr + "T00:00:00.000Z");
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setUTCDate(startOfDay.getUTCDate() - 7);
  const startOfMonth = new Date(startOfDay);
  startOfMonth.setUTCDate(1);
  const sevenDaysAgo = new Date(startOfDay);
  sevenDaysAgo.setUTCDate(startOfDay.getUTCDate() - 7);

  // Parallel DB queries
  const [
    totalUsersResult,
    totalSessionsResult,
    sessionsToday,
    sessionsWeek,
    sessionsMonth,
    activeUsersResult,
    totalSpotsResult,
    owmCalls,
  ] = await Promise.all([
    // Total users
    db.select({ count: sql<number>`count(*)::int` }).from(users),

    // Total sessions (all time)
    db.select({ count: sql<number>`count(*)::int` }).from(fishingSessions),

    // Sessions today
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(gte(fishingSessions.date, todayStr)),

    // Sessions this week
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(
        gte(
          fishingSessions.createdAt,
          startOfWeek
        )
      ),

    // Sessions this month
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(fishingSessions)
      .where(
        gte(
          fishingSessions.createdAt,
          startOfMonth
        )
      ),

    // Active users: distinct users with a session in last 7 days
    db
      .selectDistinct({ userId: fishingSessions.userId })
      .from(fishingSessions)
      .where(gte(fishingSessions.createdAt, sevenDaysAgo)),

    // Total spots
    db.select({ count: sql<number>`count(*)::int` }).from(spots),

    // OWM calls today (from Redis)
    getOwmCallsToday(),
  ]);

  const stats = {
    totalUsers: totalUsersResult[0]?.count ?? 0,
    sessions: {
      total: totalSessionsResult[0]?.count ?? 0,
      today: sessionsToday[0]?.count ?? 0,
      week: sessionsWeek[0]?.count ?? 0,
      month: sessionsMonth[0]?.count ?? 0,
    },
    totalSpots: totalSpotsResult[0]?.count ?? 0,
    activeUsers7d: activeUsersResult.length,
    owmApi: {
      callsToday: owmCalls,
      dailyBudget: OWM_DAILY_BUDGET,
      budgetUsedPct: Math.round((owmCalls / OWM_DAILY_BUDGET) * 100),
    },
    generatedAt: now.toISOString(),
  };

  return NextResponse.json(stats);
});

export const GET = handler;
