/**
 * Seed script — populates the database with realistic test data.
 * Run with: npm run db:seed
 *
 * Requires a valid DATABASE_URL environment variable.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  users,
  spots,
  spotRatings,
  fishingSessions,
  communityReports,
  pushSubscriptions,
} from "./schema";

// ---------------------------------------------------------------------------
// DB connection (same pattern as src/lib/db/index.ts)
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

// ---------------------------------------------------------------------------
// Clear existing data (respect FK order: children before parents)
// ---------------------------------------------------------------------------

async function clearData() {
  log("Clearing existing data…");
  await db.delete(pushSubscriptions);
  await db.delete(communityReports);
  await db.delete(spotRatings);
  await db.delete(fishingSessions);
  await db.delete(spots);
  await db.delete(users);
  log("All tables cleared.");
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  await clearData();

  // ── Users ─────────────────────────────────────────────────────────────────
  log("Inserting users…");
  const [user1, user2] = await db
    .insert(users)
    .values([
      {
        email: "karim.bencherif@example.com",
        name: "Karim Bencherif",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=karim",
        emailVerified: new Date("2025-01-15T10:00:00Z"),
      },
      {
        // Matches ADMIN_EMAIL so this user gets admin privileges
        email: process.env.ADMIN_EMAIL ?? "admin@fishlog.app",
        name: "Admin FishLog",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        emailVerified: new Date("2025-01-01T00:00:00Z"),
      },
    ])
    .returning();

  log(`  Created user: ${user1.email} (id: ${user1.id})`);
  log(`  Created user: ${user2.email} (id: ${user2.id})`);

  // ── Spots ──────────────────────────────────────────────────────────────────
  log("Inserting spots…");
  const [spot1, spot2, spot3, spot4] = await db
    .insert(spots)
    .values([
      {
        userId: user1.id,
        name: "Lac de Sidi Salem — Rive Nord",
        description:
          "Excellent spot pour la carpe commune. Fond vaseux, profondeur ~4 m. Meilleur en fin d'après-midi.",
        latitude: 36.6731,
        longitude: 9.3364,
        isPublic: true,
      },
      {
        userId: user1.id,
        name: "Oued Medjerda — Pont Ancien",
        description: "Spot privé sous le vieux pont. Courant modéré, silure possible.",
        latitude: 36.5987,
        longitude: 9.1245,
        isPublic: false,
      },
      {
        userId: user2.id,
        name: "Lac de Bizerte — Digue Est",
        description:
          "Bon accès, parking proche. Loup et daurade en saison. Spot communautaire populaire.",
        latitude: 37.2744,
        longitude: 9.8875,
        isPublic: true,
      },
      {
        userId: user2.id,
        name: "Cap Serrat — Rochers",
        description:
          "Spot rocheux en bord de mer. Poulpe et rouget fréquents. Nécessite des chaussures antidérapantes.",
        latitude: 37.2219,
        longitude: 9.2412,
        isPublic: true,
      },
    ])
    .returning();

  log(`  Created ${4} spots`);

  // ── Spot Ratings ───────────────────────────────────────────────────────────
  log("Inserting spot ratings…");
  await db.insert(spotRatings).values([
    {
      spotId: spot1.id,
      userId: user2.id,
      rating: 5,
      comment: "Superbe spot ! Grosse carpe de 8 kg lors de ma dernière session.",
    },
    {
      spotId: spot3.id,
      userId: user1.id,
      rating: 4,
      comment: "Accès facile et bon potentiel. Un peu bondé le week-end.",
    },
    {
      spotId: spot4.id,
      userId: user1.id,
      rating: 3,
      comment: "Beau paysage mais vent fort souvent gênant.",
    },
  ]);

  log(`  Created 3 spot ratings`);

  // ── Fishing Sessions ───────────────────────────────────────────────────────
  log("Inserting fishing sessions…");

  // Realistic weatherData shape — no fish catch data per project spec
  const weatherLacSidiSalem = {
    temperature: 18.5,
    feelsLike: 16.2,
    windSpeed: 12,
    windDirection: 220,
    windDirectionLabel: "SW",
    pressure: 1015,
    humidity: 68,
    cloudCover: 25,
    uvIndex: 4,
    moonPhase: 0.72,
    moonPhaseLabel: "Gibbeuse décroissante",
    condition: "Partiellement nuageux",
    icon: "partly-cloudy-day",
    sunrise: "06:34",
    sunset: "19:12",
  };

  const weatherBizerte = {
    temperature: 22.1,
    feelsLike: 21.0,
    windSpeed: 18,
    windDirection: 315,
    windDirectionLabel: "NW",
    pressure: 1018,
    humidity: 72,
    cloudCover: 60,
    uvIndex: 6,
    moonPhase: 0.12,
    moonPhaseLabel: "Premier croissant",
    condition: "Nuageux",
    icon: "cloudy",
    sunrise: "06:20",
    sunset: "19:28",
  };

  const weatherOued = {
    temperature: 15.0,
    feelsLike: 13.5,
    windSpeed: 8,
    windDirection: 45,
    windDirectionLabel: "NE",
    pressure: 1012,
    humidity: 80,
    cloudCover: 85,
    uvIndex: 2,
    moonPhase: 0.5,
    moonPhaseLabel: "Pleine lune",
    condition: "Couvert",
    icon: "overcast",
    sunrise: "06:55",
    sunset: "18:45",
  };

  await db.insert(fishingSessions).values([
    {
      userId: user1.id,
      spotId: spot1.id,
      date: "2026-03-15",
      technique: "Ledgering fond",
      bait: "Boilies fruits rouges 18mm + maïs",
      notes: "Session matinale. Activité notable entre 07h et 10h. Eau claire, peu de vent.",
      weatherData: weatherLacSidiSalem,
      score: 4,
    },
    {
      userId: user1.id,
      spotId: spot2.id,
      date: "2026-03-22",
      technique: "Feeder léger",
      bait: "Vers de terre + asticots",
      notes: "Courant plus fort que d'habitude suite aux pluies. Adapter le plomb.",
      weatherData: weatherOued,
      score: 3,
    },
    {
      userId: user2.id,
      spotId: spot3.id,
      date: "2026-03-20",
      technique: "Pêche au lancer — leurres souples",
      bait: "Shad 12 cm coloris sardine",
      notes: "Bonne session en soirée. Eau légèrement turbide. Retour à faire.",
      weatherData: weatherBizerte,
      score: 5,
    },
    {
      userId: user2.id,
      spotId: spot4.id,
      date: "2026-03-25",
      technique: "Pêche aux leurres durs",
      bait: "Poisson nageur flottant 9 cm",
      notes: "Vent de nord-ouest assez fort. Difficulté à maintenir le lancé précis.",
      weatherData: {
        ...weatherBizerte,
        windSpeed: 28,
        windDirection: 320,
        condition: "Venteux",
        icon: "wind",
      },
      score: 2,
    },
    {
      userId: user1.id,
      spotId: spot1.id,
      date: "2026-03-29",
      technique: "Method feeder",
      bait: "Pellets carpe 6mm + chènevis",
      notes:
        "Test du method feeder pour la première fois sur ce spot. Résultats prometteurs, à renouveler.",
      weatherData: {
        ...weatherLacSidiSalem,
        temperature: 20.3,
        condition: "Ensoleillé",
        icon: "clear-day",
        cloudCover: 5,
      },
      score: 4,
    },
  ]);

  log(`  Created 5 fishing sessions`);

  // ── Community Reports ──────────────────────────────────────────────────────
  log("Inserting community reports…");
  const expiresIn7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(communityReports).values([
    {
      userId: user1.id,
      spotId: spot3.id,
      reportType: "good_activity",
      message: "Bonne activité sur la digue est ce matin, plusieurs pêcheurs avec de belles prises.",
      latitude: 37.2744,
      longitude: 9.8875,
      expiresAt: expiresIn7Days,
    },
    {
      userId: user2.id,
      spotId: spot4.id,
      reportType: "weather_alert",
      message: "Vent fort prévu demain — conditions difficiles sur les rochers de Cap Serrat.",
      latitude: 37.2219,
      longitude: 9.2412,
      expiresAt: expiresIn7Days,
    },
  ]);

  log(`  Created 2 community reports`);

  // ── Push Subscriptions ─────────────────────────────────────────────────────
  log("Inserting push subscriptions…");
  await db.insert(pushSubscriptions).values([
    {
      userId: user1.id,
      endpoint:
        "https://fcm.googleapis.com/fcm/send/example-endpoint-abc123-karim",
      p256dh:
        "BNcRdreALRFXTkOOUHK1EtK2wtZ34Tuexe9G5qrFZ8kIy1SINmUBB7GMrpFRFmMzn6sPcmQEOJl8rXWMXV8",
      auth: "tBHItJI5svbpez7KI4CCXg==",
    },
  ]);

  log(`  Created 1 push subscription`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("");
  log("Seed complete.");
  log(`  users             : 2`);
  log(`  spots             : 4`);
  log(`  spot_ratings      : 3`);
  log(`  fishing_sessions  : 5`);
  log(`  community_reports : 2`);
  log(`  push_subscriptions: 1`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

seed()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n[seed] ERROR:", err);
    process.exit(1);
  });
