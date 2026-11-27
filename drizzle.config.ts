import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local first (local secrets), then .env as a fallback.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations use the direct/session connection string (port 5432), not the transaction pooler.
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!,
  },
});
