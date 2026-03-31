// GET /api/sessions/[id] — get single session
// PUT /api/sessions/[id] — update technique/bait/notes
// DELETE /api/sessions/[id] — delete session

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { fishingSessions } from "@/lib/db/schema/sessions";
import { spots } from "@/lib/db/schema/spots";
import { getCurrentUser } from "@/lib/auth-helpers";
import { withErrorHandler, AuthError, NotFoundError } from "@/lib/api/error-handler";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ── GET /api/sessions/[id] ─────────────────────────────────────────────────

export const GET = withErrorHandler(async (_req: NextRequest, context?: RouteContext) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await context!.params;

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
    .where(and(eq(fishingSessions.id, id), eq(fishingSessions.userId, user.id)))
    .limit(1);

  if (!rows.length) throw new NotFoundError("Session not found");

  return NextResponse.json({ session: rows[0] });
});

// ── PUT /api/sessions/[id] ─────────────────────────────────────────────────

const updateSchema = z.object({
  technique: z.string().max(100).optional(),
  bait: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const PUT = withErrorHandler(async (req: NextRequest, context?: RouteContext) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await context!.params;

  // Check ownership
  const existing = await db
    .select({ id: fishingSessions.id })
    .from(fishingSessions)
    .where(and(eq(fishingSessions.id, id), eq(fishingSessions.userId, user.id)))
    .limit(1);

  if (!existing.length) throw new NotFoundError("Session not found");

  const json = await req.json();
  const body = updateSchema.parse(json);

  const [updated] = await db
    .update(fishingSessions)
    .set({
      technique: body.technique,
      bait: body.bait,
      notes: body.notes,
      updatedAt: new Date(),
    })
    .where(eq(fishingSessions.id, id))
    .returning();

  return NextResponse.json({ session: updated });
});

// ── DELETE /api/sessions/[id] ──────────────────────────────────────────────

export const DELETE = withErrorHandler(async (_req: NextRequest, context?: RouteContext) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await context!.params;

  const existing = await db
    .select({ id: fishingSessions.id })
    .from(fishingSessions)
    .where(and(eq(fishingSessions.id, id), eq(fishingSessions.userId, user.id)))
    .limit(1);

  if (!existing.length) throw new NotFoundError("Session not found");

  await db
    .delete(fishingSessions)
    .where(eq(fishingSessions.id, id));

  return NextResponse.json({ success: true });
});
