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
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
