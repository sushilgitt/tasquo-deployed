import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// `next build` imports this module to collect page data but never queries the database,
// so a placeholder is only used during that build phase.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!process.env.DATABASE_URL && !isBuildPhase) {
  // Fail with a clear message instead of silently trying localhost:5432, which only
  // surfaces as a generic "server error" page in the browser.
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local (or set it in your hosting " +
      "environment) and point it at your Supabase pooler connection string.",
  );
}

const connectionString =
  process.env.DATABASE_URL ?? "postgres://missing:missing@localhost:5432/missing";

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(connectionString, {
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
