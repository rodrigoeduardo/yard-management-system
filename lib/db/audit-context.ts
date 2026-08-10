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
 * Looks up whether `userId` is a viewer account, straight from
 * `auth.users.raw_user_meta_data` — the same `app_role` field
 * `lib/auth/current-role.ts` reads off the session (`user_metadata.app_role`
 * is Supabase's client-side view of that same column). Queried here rather
 * than threaded in from the caller so the role switch below stays correct
 * even if a future mutation path forgets the app-level guard
 * (`lib/actions/guard.ts`) — this is the database-level backstop for that,
 * not a duplicate of it.
 */
async function isViewerUser(tx: Transaction, userId: string): Promise<boolean> {
  const rows = await tx.execute<{ app_role: string | null }>(
    sql`select raw_user_meta_data ->> 'app_role' as app_role from auth.users where id = ${userId}`,
  );
  return rows[0]?.app_role === "viewer";
}

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
 * For a viewer account, this also runs `SET LOCAL ROLE yms_viewer`
 * (`drizzle/0017_viewer_role_enforcement.sql`) right after the GUC is set —
 * order matters, since the restricted role must not be allowed to block the
 * GUC write itself. `SET LOCAL` has the exact same transaction-local scope
 * as `set_config(..., true)`, so the role switch is cleared on commit or
 * rollback the same way and can never leak onto the pooled connection
 * either. `yms_viewer` has `SELECT` only, no `INSERT`/`UPDATE`/`DELETE` on
 * any app table, so a viewer transaction that reaches a write here — even
 * one the application-level guard should have refused — is rejected by
 * Postgres itself. An operator (or an unauthenticated/system `userId ===
 * null` context) never switches role and behaves exactly as before.
 *
 * This is the single choke point for audited app mutations: every mutation
 * that must be attributable to a user calls this instead of
 * `db.transaction` directly, so no mutation path can bypass setting the
 * audit context or the viewer role switch.
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
      if (await isViewerUser(tx, userId)) {
        await tx.execute(sql`set local role yms_viewer`);
      }
    }
    return fn(tx);
  });
}
