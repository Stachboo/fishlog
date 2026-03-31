// GET    /api/spots/[id]  — spot details with ratings
// PUT    /api/spots/[id]  — update (owner only)
// DELETE /api/spots/[id]  — delete (owner only)

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { spots, spotRatings } from "@/lib/db/schema";
import { updateSpotSchema } from "@/lib/validations/spot";
import {
  withErrorHandler,
  AuthError,
  NotFoundError,
} from "@/lib/api/error-handler";
import { getCurrentUser } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

// ── GET ────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (_req: NextRequest, ctx?: Ctx) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await ctx!.params;

  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) throw new NotFoundError("Spot not found");

  // Only the owner can access private spots
  if (!spot.isPublic && spot.userId !== user.id) throw new AuthError("Forbidden");

  const ratings = await db
    .select()
    .from(spotRatings)
    .where(eq(spotRatings.spotId, id));

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;

  return NextResponse.json({ ...spot, ratings, avgRating });
});

// ── PUT ────────────────────────────────────────────────────────────────────

export const PUT = withErrorHandler(async (req: NextRequest, ctx?: Ctx) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await ctx!.params;

  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) throw new NotFoundError("Spot not found");
  if (spot.userId !== user.id) throw new AuthError("Forbidden");

  const body = await req.json();
  const data = updateSpotSchema.parse(body);

  const [updated] = await db
    .update(spots)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(spots.id, id))
    .returning();

  return NextResponse.json(updated);
});

// ── DELETE ─────────────────────────────────────────────────────────────────

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx?: Ctx) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id } = await ctx!.params;

  const [spot] = await db.select().from(spots).where(eq(spots.id, id));
  if (!spot) throw new NotFoundError("Spot not found");
  if (spot.userId !== user.id) throw new AuthError("Forbidden");

  await db.delete(spots).where(eq(spots.id, id));

  return NextResponse.json({ success: true });
});
