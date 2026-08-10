/**
 * CLI entry point for the post-migrate watermark guard (#328). Run immediately after
 * `drizzle-kit migrate` (see `npm run db:migrate`) so a migrate run that silently applied nothing
 * fails loudly instead of reporting success. Pure comparison logic lives in
 * `scripts/lib/verify-migration-watermark.ts` so it's unit-testable without a database.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { assertMigrationWatermark } from "./lib/verify-migration-watermark";
import { loadEnv } from "./lib/load-env";

loadEnv();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing database environment variable: ${name}`);
  }
  return value;
}

function readJournalEntryCount(): number {
  const journalPath = join(process.cwd(), "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: unknown[];
  };
  return journal.entries.length;
}

async function main(): Promise<void> {
  const journalCount = readJournalEntryCount();

  const sql = postgres(requireEnv("SUPABASE_DB_URL"));
  try {
    const [{ count }] = await sql<
      { count: number }[]
    >`select count(*)::int as count from drizzle.__drizzle_migrations`;

    assertMigrationWatermark(journalCount, count);

    console.log(
      `Migration watermark OK: ${journalCount} journal entries, ${count} applied rows.`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
