import { afterEach, describe, expect, it } from "vitest";
import { createSupabaseSsrServerClient, writeSsrCookies } from "./ssr-server";

function fakeCookieStore() {
  const store = new Map<string, string>();
  return {
    getAll: () =>
      Array.from(store.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
  };
}

describe("createSupabaseSsrServerClient", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

    expect(() => createSupabaseSsrServerClient(fakeCookieStore())).toThrow(
      /Missing Supabase environment variable/,
    );
  });

  it("throws when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(() => createSupabaseSsrServerClient(fakeCookieStore())).toThrow(
      /Missing Supabase environment variable/,
    );
  });

  it("returns a client when both env vars are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

    const client = createSupabaseSsrServerClient(fakeCookieStore());

    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth.signInWithPassword).toBe("function");
  });
});

describe("writeSsrCookies", () => {
  // Root cause of #124 (premature logout after idle hours): this client is
  // called directly from plain Server Components -- app/(authenticated)/
  // layout.tsx and app/(authenticated)/page.tsx -- via `getUser()`, which
  // can trigger a token refresh. Next.js only allows cookie writes from
  // Server Actions, Route Handlers, and middleware, so `cookieStore.set`
  // throws when called from a Server Component. Before this fix, that
  // throw happened inside @supabase/ssr's fire-and-forget
  // onAuthStateChange handler: the refresh still succeeded against
  // Supabase Auth (rotating the refresh token) but the new token pair was
  // never persisted to the browser's cookies. The browser kept the old,
  // now-already-used refresh token, so the next refresh attempt --
  // in lib/supabase/middleware.ts, which *can* write cookies -- was
  // rejected as reuse, and Supabase revoked the whole session (see
  // "refresh token reuse detection" in
  // https://supabase.com/docs/guides/auth/sessions). That produced a real,
  // hard logout on the request right after an invisible failed one.
  //
  // Swallowing the error here is safe because lib/supabase/middleware.ts
  // already refreshes and persists the session on every matched request
  // before any Server Component runs.
  it("does not throw when the cookie store rejects writes (Server Component context)", () => {
    const attempted: string[] = [];
    const readOnlyStore = {
      getAll: () => [],
      set: (name: string) => {
        attempted.push(name);
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler",
        );
      },
    };

    expect(() =>
      writeSsrCookies(readOnlyStore, [
        { name: "sb-access-token", value: "new-access" },
        { name: "sb-refresh-token", value: "new-refresh" },
      ]),
    ).not.toThrow();

    // Every cookie is still attempted -- one rejected write must not
    // prevent the rest of the chunk set from being tried.
    expect(attempted).toEqual(["sb-access-token", "sb-refresh-token"]);
  });

  it("still writes cookies normally when the store accepts writes", () => {
    const store = fakeCookieStore();

    writeSsrCookies(store, [{ name: "sb-access-token", value: "value" }]);

    expect(store.getAll()).toEqual([{ name: "sb-access-token", value: "value" }]);
  });
});
