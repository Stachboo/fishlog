import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Guard: during build-time static analysis DATABASE_URL may not be set.
// At runtime (dev/prod) it must be defined.
const connectionString = process.env.DATABASE_URL ?? "postgresql://user:password@localhost/fishlog";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
