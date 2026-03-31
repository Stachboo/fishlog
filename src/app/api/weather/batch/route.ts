// POST /api/weather/batch
// Fetches weather for multiple coordinates in parallel.
// Body: { coordinates: Array<{ lat: number, lon: number }> }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler, AuthError } from "@/lib/api/error-handler";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getWeather } from "@/lib/services/weather";

const bodySchema = z.object({
  coordinates: z
    .array(
      z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
      })
    )
    .min(1)
    .max(20),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const json = await req.json();
  const { coordinates } = bodySchema.parse(json);

  const results = await Promise.all(
    coordinates.map(({ lat, lon }) =>
      getWeather(lat, lon).catch(() => null)
    )
  );

  return NextResponse.json({ results });
});
