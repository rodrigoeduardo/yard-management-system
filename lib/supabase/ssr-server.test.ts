import { afterEach, describe, expect, it } from "vitest";
import { createSupabaseSsrServerClient } from "./ssr-server";

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
