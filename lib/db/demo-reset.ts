/**
 * App-side entry point for the nightly demo reset (ADR 0003:
 * docs/adr/0003-nightly-demo-reset.md).
 *
 * The actual truncate-then-reseed logic lives entirely in the
 * `reset_demo_data()` Postgres function defined by the
 * `drizzle/0008_demo_reset_function.sql` migration — it has to be a plain
 * SQL/plpgsql function (not application code) because pg_cron calls it
 * directly, with no Node runtime involved. This module is a thin wrapper so
 * the function is reachable/testable the same way the rest of the app talks
 * to the database, and so nothing outside this migration needs to know the
 * function's exact name.
 *
 * Fork-safety (ADR 0001/0003): the migration only *defines* the function —
 * it never schedules it. See docs/workflow/demo-reset-scheduling.md for the
 * manual pg_cron scheduling step, which is applied only on the demo
 * Supabase project.
 */
import { sql } from "drizzle-orm";
import { db } from "./index";

/** Truncates the demo dataset tables and reseeds the fixed demo dataset, in one transaction. */
export async function resetDemoData(): Promise<void> {
  await db.execute(sql`select reset_demo_data()`);
}
