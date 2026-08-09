/**
 * FEATURE_REMOVAL_CANCEL (off by default, issue #310) gates the removal
 * cancellation action and its UI entirely: with the flag unset, there is no
 * cancellation control, no server action path, and no behaviour change
 * anywhere. Same pattern as `isDemoModeEnabled` in
 * `lib/supabase/middleware.ts`.
 *
 * Server-only: callers pass the boolean down as a prop to client components
 * — never read `process.env` from a client component.
 */
export function isRemovalCancelEnabled(): boolean {
  return process.env.FEATURE_REMOVAL_CANCEL === "true";
}
