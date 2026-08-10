import { cookies } from "next/headers";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

export type AppRole = "operator" | "viewer";

/**
 * Pure role resolution from an already-fetched Supabase user (or `null`).
 * Exported so callers that already hold a `user` object — e.g.
 * `lib/supabase/middleware.ts`, which fetches it once for the session-cookie
 * refresh — can resolve the role without a second `auth.getUser()` round
 * trip. `getCurrentUserRole` below is the same logic for callers that don't
 * already have one.
 *
 * Absent `app_role` — every pre-existing account, plus every operator
 * registration, which never sets it — resolves to "operator", the
 * backwards-compatible default. No session also resolves to "operator" so
 * an unauthenticated/system caller isn't treated as a viewer; other checks
 * upstream are responsible for keeping such callers out.
 */
export function resolveAppRole(
  user: { user_metadata?: { app_role?: string } } | null | undefined,
): AppRole {
  return user?.user_metadata?.app_role === "viewer" ? "viewer" : "operator";
}

/**
 * The current request's role, resolved from the Supabase session's
 * `user_metadata.app_role` (set at registration — see
 * `app/register/actions.ts`). This is the single source every write guard
 * (`lib/actions/guard.ts`) reads from.
 */
export async function getCurrentUserRole(): Promise<AppRole> {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return resolveAppRole(user);
}
