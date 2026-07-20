/**
 * Seed synthetic demo data for pagination testing (issue #203).
 *
 * Inserts clearly-marked, business-rule-compliant loads and removals into
 * the dev Supabase database (SUPABASE_DB_URL) so the stock and removal-log
 * sections have enough rows to exercise pagination (>= 3 pages at the
 * current page size of 10 — see `lib/inventory/stock-query.ts` and
 * `lib/inventory/removal-query.ts`).
 *
 * All synthetic rows are tagged with the `SEED-` marker prefix:
 *   - loads.nota_fiscal   -> "SEED-LOAD-0001", "SEED-LOAD-0002", ...
 *   - removals.driver     -> "SEED-DRIVER-0001", "SEED-DRIVER-0002", ...
 * so they're always easy to spot in the shared dev database and safe to
 * purge without touching real data.
 *
 * Idempotent: re-running skips any marker NF/driver that already exists, so
 * it never duplicates rows.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts            # seed (default: 30 loads, 30 removals)
 *   npx tsx scripts/seed-demo-data.ts --clean     # remove all synthetic "SEED-" rows
 *
 * Requires SUPABASE_DB_URL in `.env.local` (see docs/specs/architecture.md).
 */
import { loadEnv } from "./lib/load-env";

async function main() {
  // Must run before importing anything that touches the DB (@/lib/db reads
  // its connection string at import time).
  loadEnv();

  const { cleanDemoData, seedDemoData } = await import(
    "./lib/seed-demo-data"
  );

  if (process.argv.includes("--clean")) {
    const result = await cleanDemoData();
    console.log(
      `Removed ${result.loadsDeleted} synthetic load(s) and ${result.removalsDeleted} synthetic removal(s).`,
    );
    return;
  }

  const summary = await seedDemoData();
  console.log(
    `Loads: ${summary.loadsCreated} created, ${summary.loadsSkipped} already present.`,
  );
  console.log(
    `Removals: ${summary.removalsCreated} created, ${summary.removalsSkipped} already present.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
