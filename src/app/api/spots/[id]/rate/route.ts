// POST /api/spots/[id]/rate — rate a spot (upsert, 1-5)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { spots, spotRatings } from "@/lib/db/schema";
import { withErrorHandler, AuthError, NotFoundError } from "@/lib/api/error-handler";
import { getCurrentUser } from "@/lib/auth-helpers";

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (req: NextRequest, ctx?: Ctx) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { id: spotId } = await ctx!.params;

  const [spot] = await db.select().from(spots).where(eq(spots.id, spotId));
  if (!spot) throw new NotFoundError("Spot not found");

  const body = await req.json();
  const { rating, comment } = rateSchema.parse(body);

  // Upsert: one rating per user per spot
  const existing = await db
    .select()
    .from(spotRatings)
    .where(
      and(eq(spotRatings.spotId, spotId), eq(spotRatings.userId, user.id))
    );

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(spotRatings)
      .set({ rating, comment })
      .where(
        and(eq(spotRatings.spotId, spotId), eq(spotRatings.userId, user.id))
      )
      .returning();
  } else {
    [result] = await db
      .insert(spotRatings)
      .values({ spotId, userId: user.id, rating, comment })
      .returning();
  }

  return NextResponse.json(result, { status: 200 });
});
