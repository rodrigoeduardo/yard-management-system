import { createServerClient } from "@supabase/ssr";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`);
  }
  return value;
}

export interface SsrCookieStore {
  getAll: () => { name: string; value: string }[];
  set: (
    name: string,
    value: string,
    options?: Record<string, unknown>,
  ) => void;
}

interface CookieToSet {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

/**
 * Writes refreshed session cookies, tolerating a read-only cookie store.
 *
 * This client is used directly from plain Server Components
 * (app/(authenticated)/layout.tsx, app/(authenticated)/page.tsx) via
 * `supabase.auth.getUser()`, which can trigger a token refresh. Next.js only
 * allows cookie writes from Server Actions, Route Handlers, and middleware,
 * so `cookieStore.set` throws when called from a Server Component. Left
 * unhandled, that throw happens inside @supabase/ssr's fire-and-forget
 * onAuthStateChange handler: the refresh still succeeds against Supabase
 * Auth (rotating the refresh token), but the new token pair is never
 * persisted to the browser's cookies. The browser then keeps the old,
 * already-used refresh token, so the *next* refresh attempt — in
 * lib/supabase/middleware.ts, which can write cookies — is rejected as
 * reuse and Supabase revokes the whole session. That is the root cause of
 * a premature logout after an idle period long enough for the access
 * token to expire: an invisible failed refresh here, followed by a real
 * logout on the next request.
 *
 * Swallowing the error is safe (and matches the official @supabase/ssr
 * Next.js pattern) because lib/supabase/middleware.ts already refreshes
 * and persists the session on every matched request before any Server
 * Component runs.
 */
export function writeSsrCookies(
  cookieStore: Pick<SsrCookieStore, "set">,
  cookiesToSet: CookieToSet[],
): void {
  for (const { name, value, options } of cookiesToSet) {
    try {
      cookieStore.set(name, value, options);
    } catch {
      // See doc comment above — expected when called from a Server
      // Component; middleware.ts is the authoritative place that persists
      // refreshed sessions.
    }
  }
}

/**
 * Cookie-backed client for Server Components/Actions/Route Handlers.
 * Uses the publishable key so all queries run through RLS, same as
 * lib/supabase/server.ts — this variant persists the session via cookies
 * instead of requiring an explicit sign-in per request.
 */
export function createSupabaseSsrServerClient(cookieStore: SsrCookieStore) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  return createServerClient(url, publishableKey, {
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => writeSsrCookies(cookieStore, cookiesToSet),
    },
  });
}
