// POST /api/push/subscribe  — save push subscription for current user
// DELETE /api/push/subscribe — remove push subscription

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-helpers";
import { withErrorHandler } from "@/lib/api/error-handler";
import { eq } from "drizzle-orm";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// ── POST ───────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const body = await req.json();
  const { endpoint, keys } = subscribeSchema.parse(body);

  // Upsert: delete existing record for this endpoint then insert fresh
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));

  const [sub] = await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .returning();

  return NextResponse.json(sub, { status: 201 });
});

// ── DELETE ─────────────────────────────────────────────────────────────────

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();
  const body = await req.json();
  const { endpoint } = unsubscribeSchema.parse(body);

  await db
    .delete(pushSubscriptions)
    .where(
      eq(pushSubscriptions.endpoint, endpoint)
    );

  return NextResponse.json({ ok: true });
});
