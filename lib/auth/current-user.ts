import { cookies } from "next/headers";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

/**
 * The current request's authenticated user id (Supabase auth id), read from
 * the session cookies — or `null` when there is no session.
 *
 * Audited server actions (`lib/actions/*.ts`) call this to get the acting
 * user's id before running a mutation, then pass it into `withAuditUser`
 * (`lib/db/audit-context.ts`) so `audit_log.user_id` reflects who performed
 * it. `supabase.auth.getUser()` returning an error (e.g. no session) is not
 * exceptional here — it just means an unauthenticated/system caller, so it
 * resolves to `null` rather than throwing.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
