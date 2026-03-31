/**
 * Verification script — runs relation queries and constraint checks.
 * Run with: npm run db:verify
 *
 * Requires a valid DATABASE_URL environment variable (and seeded data).
 * Each check logs PASS or FAIL.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql as rawSql } from "drizzle-orm";
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
// DB connection
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function pass(label: string, detail?: string) {
  passed++;
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label: string, err: unknown) {
  failed++;
  const msg = err instanceof Error ? err.message : String(err);
  console.log(`  FAIL  ${label} — ${msg}`);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** 1. Fetch user with all their spots (relation query) */
async function checkUserWithSpots() {
  const label = "User → spots (relation query)";
  try {
    const result = await db.query.users.findFirst({
      with: { spots: true },
    });
    if (!result) throw new Error("No users found");
    pass(label, `user "${result.email}" has ${result.spots.length} spot(s)`);
  } catch (err) {
    fail(label, err);
  }
}

/** 2. Fetch spot with all ratings (relation query) */
async function checkSpotWithRatings() {
  const label = "Spot → ratings (relation query)";
  try {
    const result = await db.query.spots.findFirst({
      with: { ratings: true },
    });
    if (!result) throw new Error("No spots found");
    pass(label, `spot "${result.name}" has ${result.ratings.length} rating(s)`);
  } catch (err) {
    fail(label, err);
  }
}

/** 3. Fetch sessions for a user with spot data (join via relation) */
async function checkSessionsWithSpot() {
  const label = "Sessions → spot (relation join)";
  try {
    const firstUser = await db.select({ id: users.id }).from(users).limit(1);
    if (!firstUser.length) throw new Error("No users found");

    const sessions = await db.query.fishingSessions.findMany({
      where: eq(fishingSessions.userId, firstUser[0].id),
      with: { spot: true },
    });
    pass(label, `${sessions.length} session(s) with spot data loaded`);
  } catch (err) {
    fail(label, err);
  }
}

/** 4. Count records per table */
async function checkTableCounts() {
  const label = "Table record counts";
  try {
    const counts = await Promise.all([
      db.select({ n: rawSql<number>`count(*)::int` }).from(users),
      db.select({ n: rawSql<number>`count(*)::int` }).from(spots),
      db.select({ n: rawSql<number>`count(*)::int` }).from(spotRatings),
      db.select({ n: rawSql<number>`count(*)::int` }).from(fishingSessions),
      db.select({ n: rawSql<number>`count(*)::int` }).from(communityReports),
      db.select({ n: rawSql<number>`count(*)::int` }).from(pushSubscriptions),
    ]);

    const [u, sp, sr, fs, cr, ps] = counts.map((r) => r[0].n);
    const detail =
      `users=${u}, spots=${sp}, spot_ratings=${sr}, ` +
      `fishing_sessions=${fs}, community_reports=${cr}, push_subscriptions=${ps}`;

    // Validate expected counts from seed
    if (u < 1 || sp < 1 || fs < 1) {
      throw new Error(`Unexpected low counts: ${detail}`);
    }
    pass(label, detail);
  } catch (err) {
    fail(label, err);
  }
}

/**
 * 5. Unique constraint on spot_ratings (spotId + userId).
 * Try inserting a duplicate entry — expect an error.
 */
async function checkUniqueConstraint() {
  const label = "Unique constraint on spot_ratings (spot+user)";
  try {
    // Find an existing rating to duplicate
    const existing = await db
      .select()
      .from(spotRatings)
      .limit(1);

    if (!existing.length) {
      throw new Error("No existing ratings to test constraint with");
    }

    const { spotId, userId } = existing[0];

    // Attempt duplicate insert — must throw
    let threw = false;
    try {
      await db.insert(spotRatings).values({ spotId, userId, rating: 1 });
    } catch {
      threw = true;
    }

    if (!threw) {
      throw new Error("Duplicate insert succeeded — unique constraint not enforced");
    }
    pass(label, "duplicate insert correctly rejected");
  } catch (err) {
    fail(label, err);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function verify() {
  console.log("\n=== FishLog — Database Verification ===\n");

  await checkUserWithSpots();
  await checkSpotWithRatings();
  await checkSessionsWithSpot();
  await checkTableCounts();
  await checkUniqueConstraint();

  console.log(
    `\n=== Results: ${passed} passed, ${failed} failed ===\n`
  );

  process.exit(failed > 0 ? 1 : 0);
}

verify().catch((err) => {
  console.error("[verify] Unexpected error:", err);
  process.exit(1);
});
