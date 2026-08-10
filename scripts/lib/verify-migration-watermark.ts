/**
 * Post-migrate watermark guard (#328).
 *
 * `drizzle-kit migrate` (`PgDialect.migrate` in `drizzle-orm/pg-core/dialect.js`) applies a
 * migration only when its journal `when` is strictly greater than `max(created_at)` already
 * recorded in `drizzle.__drizzle_migrations` — read once, compared positionally, never by hash.
 * A migration numbering collision (or any hand-edited `when`) can leave that watermark ahead of a
 * still-pending migration, so `drizzle-kit migrate` silently applies nothing and still prints
 * `[✓] migrations applied successfully!` (see PR #325's incident writeup).
 *
 * The only structural invariant that catches this: after a clean run, the number of rows in
 * `drizzle.__drizzle_migrations` must equal the number of entries in `drizzle/meta/_journal.json`.
 * A mismatch means at least one journalled migration never got applied.
 */
export class MigrationWatermarkMismatchError extends Error {
  constructor(journalCount: number, appliedCount: number) {
    super(
      `Migration watermark mismatch: drizzle/meta/_journal.json has ${journalCount} entries but ` +
        `drizzle.__drizzle_migrations reports ${appliedCount} applied rows. drizzle-kit migrate ` +
        `can report success while silently skipping pending migrations when the recorded ` +
        `watermark sits ahead of a journal entry's "when" (see issue #328 / PR #325) — treat this ` +
        `as a failed migrate run, not a warning.`,
    );
    this.name = "MigrationWatermarkMismatchError";
  }
}

/**
 * Throws {@link MigrationWatermarkMismatchError} unless every journalled migration has a
 * corresponding applied row. Intended to run immediately after `drizzle-kit migrate` so a no-op
 * migrate can never again exit zero.
 */
export function assertMigrationWatermark(
  journalCount: number,
  appliedCount: number,
): void {
  if (journalCount !== appliedCount) {
    throw new MigrationWatermarkMismatchError(journalCount, appliedCount);
  }
}
