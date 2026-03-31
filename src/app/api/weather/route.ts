// GET /api/weather?lat={lat}&lon={lon}
// Returns WeatherData for a single coordinate.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler, AuthError } from "@/lib/api/error-handler";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getWeather } from "@/lib/services/weather";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized");

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.parse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });

  const data = await getWeather(parsed.lat, parsed.lon);
  return NextResponse.json(data);
});
