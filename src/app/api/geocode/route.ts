// GET /api/geocode?q={query}
// Searches locations via Nominatim OpenStreetMap.
// Returns top 5 results. Public endpoint (no auth required for search UX).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/error-handler";

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    country_code?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const { q } = querySchema.parse({ q: searchParams.get("q") });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a valid User-Agent
      "User-Agent": "FishLog/1.0 (contact@fishlog.app)",
      "Accept-Language": "fr,en;q=0.9",
    },
    next: { revalidate: 60 }, // cache geocode results for 1 minute
  });

  if (!res.ok) {
    throw new Error(`Nominatim error ${res.status}`);
  }

  const raw: NominatimResult[] = await res.json();

  const results: GeocodedLocation[] = raw.map((r) => {
    const addr = r.address ?? {};
    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
    const displayCity = city
      ? city
      : r.display_name.split(",")[0].trim();
    const country = addr.country ?? addr.country_code?.toUpperCase() ?? "";

    return {
      name: `${displayCity}${country ? `, ${country}` : ""}`,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      country,
    };
  });

  return NextResponse.json(results);
});
