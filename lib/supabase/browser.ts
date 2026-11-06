import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side client, used only to upload a Pedido image straight to
 * Storage through a signed upload URL (lib/removals/pedido-image-upload.ts).
 * The signed token authorizes that upload, so no session is involved.
 *
 * The env vars are read as literal `process.env.NEXT_PUBLIC_*` accesses so
 * Next.js inlines them into the client bundle — a dynamic
 * `process.env[name]` lookup would be undefined in the browser.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(url, publishableKey);
}
