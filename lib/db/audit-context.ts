import { sql } from "drizzle-orm";
import { db } from "./index";

type TransactionCallback = Parameters<typeof db.transaction>[0];

/** A `db.transaction` callback's `tx` — the same client shape as `db`, scoped to one transaction. */
export type Transaction = TransactionCallback extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

/**
 * Runs `fn` inside a single database transaction with the acting user's id
 * available to Postgres as `auth.uid()` — the same GUC
 * (`request.jwt.claim.sub`) Supabase's `auth.uid()` reads, and the value the
 * `audit_log` triggers (`drizzle/0004_audit_log_user_id.sql`) stamp onto
 * `audit_log.user_id` for every audited INSERT/UPDATE/DELETE.
 *
 * The app connects to Postgres directly via `postgres-js`
 * (`lib/db/index.ts`), not through Supabase's PostgREST/Auth layer, so that
 * GUC is never set on its own — this is the app-side fix for that gap.
 *
 * `set_config(..., true)` — the trailing `true` — makes the setting
 * transaction-local: Postgres clears it when the transaction ends
 * (commit or rollback), so a pooled connection handed back to the pool can
 * never leak one request's user id into the next request's queries.
 *
 * `userId` is `null` for unauthenticated/system paths (migrations, seed
 * script, direct admin SQL): the setting is simply left unset, `auth.uid()`
 * evaluates to `NULL`, and audited DML still succeeds with
 * `audit_log.user_id = NULL`.
 *
 * This is the single choke point for audited app mutations: every mutation
 * that must be attributable to a user calls this instead of
 * `db.transaction` directly, so no mutation path can bypass setting the
 * audit context.
 */
export async function withAuditUser<T>(
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    if (userId !== null) {
      await tx.execute(
        sql`select set_config('request.jwt.claim.sub', ${userId}, true)`,
      );
    }
    return fn(tx);
  });
}
