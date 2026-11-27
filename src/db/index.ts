import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// postgres.js connects lazily, so a placeholder lets the app build without credentials.
// A real query without DATABASE_URL will fail with a connection error.
const connectionString =
  process.env.DATABASE_URL ?? "postgres://missing:missing@localhost:5432/missing";
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

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
