import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { updateSession } from "./middleware";

// Exercises DEMO_MODE end-to-end against the real local Supabase stack (no
// mocking of @supabase/ssr) — complements the mocked scenarios in
// middleware.test.ts by proving the demo user credentials actually
// establish a real session cookie.
describe("updateSession against a real Supabase stack in DEMO_MODE", () => {
  const ORIGINAL_ENV = { ...process.env };

  function requireTestEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
  }

  beforeEach(() => {
    process.env.DEMO_MODE = "true";
    process.env.DEMO_USER_EMAIL = requireTestEnv("DEMO_USER_EMAIL");
    process.env.DEMO_USER_PASSWORD = requireTestEnv("DEMO_USER_PASSWORD");
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("redirects /login into the app", async () => {
    const request = new NextRequest("https://example.test/login");

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("redirects /register into the app", async () => {
    const request = new NextRequest("https://example.test/register");

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("establishes a real demo-user session cookie for a first-time visitor instead of redirecting to /login", async () => {
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSession(request);

    expect(response.status).not.toBe(307);
    const cookies = response.cookies.getAll();
    expect(cookies.some((cookie) => cookie.name.startsWith("sb-"))).toBe(true);
  });
});
