/**
 * Seeds a fixed, realistic PT-BR demo dataset into the database pointed at
 * by SUPABASE_DB_URL: several materials, open loads with items (typically
 * 15-18, varying weights), removals spanning items from multiple loads
 * (the multi-load removal invariant), and one finished load (item_count = 0,
 * remaining_weight = 0 — renders green in Estoque).
 *
 * Standalone and idempotent, so it doubles as:
 *   - the seed step of the nightly demo reset job (ADR 0003:
 *     docs/adr/0003-nightly-demo-reset.md);
 *   - a one-shot way to populate a fresh local Supabase stack for
 *     development (see README.md's "Demo dataset" section).
 *
 * Rows are keyed by their Nota Fiscal (loads) / driver name (removals):
 * re-running against the same database skips rows that already exist, so it
 * never duplicates data or errors.
 *
 * Seeding goes through the same insert helpers the app itself uses
 * (`insertLoadWithItems`, `removeScannedItems` in `lib/db/`), so the usual
 * audit_log triggers fire for every seeded row.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-dataset.ts
 *   npm run seed:demo
 *
 * Requires SUPABASE_DB_URL in `.env.local` (see docs/specs/architecture.md),
 * or the local Supabase stack started via `npm run test:integration:setup`.
 */
import { loadEnv } from "./lib/load-env";

async function main() {
  // Must run before importing anything that touches the DB (@/lib/db reads
  // its connection string at import time).
  loadEnv();

  const { seedDemoDataset } = await import("./lib/demo-dataset");

  const summary = await seedDemoDataset();
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
