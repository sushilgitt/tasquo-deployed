// Runs one lightweight query against the database so Supabase sees activity
// and does not pause the free-tier project. Run locally with: npm run keep-alive
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

try {
  const [row] = await sql`select now() as server_time`;
  console.log(`Keep-alive OK. Database time: ${row.server_time}`);
} catch (err) {
  console.error("Keep-alive FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
