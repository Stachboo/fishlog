import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/error-handler";
import { getHourlyForecast } from "@/lib/services/forecast";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.parse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });

  const hourly = await getHourlyForecast(parsed.lat, parsed.lon);
  return NextResponse.json({ hourly });
});
