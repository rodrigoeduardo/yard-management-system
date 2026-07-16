import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Supabase environment variable: ${name}`);
  }
  return value;
}

/**
 * Uses the publishable (anon) key so all queries run through RLS.
 * Do not swap in the service role key here — that bypasses RLS and
 * belongs only in narrowly-scoped, non-request-path admin tooling.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  return createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
}
