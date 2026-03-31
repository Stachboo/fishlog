// GET /api/spots   — user's private spots + all public spots
// POST /api/spots  — create a new spot

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { spots } from "@/lib/db/schema";
import { createSpotSchema } from "@/lib/validations/spot";
import { withErrorHandler, AuthError } from "@/lib/api/error-handler";
import { getCurrentUser } from "@/lib/auth-helpers";

// ── GET ────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? user.id;

  // Return the requesting user's private spots + all public spots
  const rows = await db
    .select()
    .from(spots)
    .where(or(eq(spots.isPublic, true), eq(spots.userId, user.id)));

  return NextResponse.json(rows);
});

// ── POST ───────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const body = await req.json();
  const data = createSpotSchema.parse(body);

  const [spot] = await db
    .insert(spots)
    .values({
      userId: user.id,
      name: data.name,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      isPublic: data.isPublic,
    })
    .returning();

  return NextResponse.json(spot, { status: 201 });
});
