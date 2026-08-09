import { getCurrentUserRole } from "@/lib/auth/current-role";

export const VIEWER_WRITE_ERROR_MESSAGE =
  "Contas de visualização não podem realizar esta ação.";

/**
 * The single write guard every mutating action in `lib/actions/*.ts` calls
 * as its first step, before any database access. Resolves the caller's role
 * (`lib/auth/current-role.ts`) and refuses viewer sessions; operators and
 * legacy sessions with no `app_role` are unaffected.
 *
 * `guard-coverage.test.ts` enumerates every export of every module in this
 * directory and fails when a new one is added without being classified as
 * either guarded (calls this) or explicitly read-only — so this can't
 * silently rot as new actions land.
 */
export async function isViewerWriteRefused(): Promise<boolean> {
  const role = await getCurrentUserRole();
  if (role === "viewer") {
    console.warn("Viewer session refused a write action.");
    return true;
  }
  return false;
}
