// GET /api/geocode?q={query}
// Searches locations via Nominatim OpenStreetMap.
// Returns top 5 results. Public endpoint (no auth required for search UX).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/error-handler";

const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
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

  // Reverse geocode: /api/geocode?lat=X&lon=Y
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  if (latParam && lonParam) {
    const { lat, lon } = reverseSchema.parse({ lat: latParam, lon: lonParam });

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lon.toString());
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "FishLog/1.0 (contact@fishlog.app)",
        "Accept-Language": "fr,en;q=0.9",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const raw: NominatimResult = await res.json();
    const addr = raw.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
    const displayCity = city || raw.display_name.split(",")[0].trim();
    const country = addr.country ?? addr.country_code?.toUpperCase() ?? "";

    const result: GeocodedLocation = {
      name: `${displayCity}${country ? `, ${country}` : ""}`,
      lat: parseFloat(raw.lat),
      lon: parseFloat(raw.lon),
      country,
    };

    return NextResponse.json(result);
  }

  // Forward geocode: /api/geocode?q=query
  const { q } = searchSchema.parse({ q: searchParams.get("q") });

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "FishLog/1.0 (contact@fishlog.app)",
      "Accept-Language": "fr,en;q=0.9",
    },
    next: { revalidate: 60 },
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
