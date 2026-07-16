import { afterEach, describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "./server";

describe("createSupabaseServerClient", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    expect(() => createSupabaseServerClient()).toThrow(
      /Missing Supabase environment variable/,
    );
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createSupabaseServerClient()).toThrow(
      /Missing Supabase environment variable/,
    );
  });

  it("returns a client when both env vars are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    const client = createSupabaseServerClient();

    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
