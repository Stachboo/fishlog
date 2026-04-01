import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://user:password@localhost/fishlog";
    const sql = neon(connectionString);
    await sql`SELECT 1`;

    return NextResponse.json(
      { status: "ok", timestamp, db: "connected" },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "degraded", timestamp, db: "error", error: message },
      { status: 503 },
    );
  }
}
