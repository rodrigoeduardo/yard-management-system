import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isPublicPath, updateSession } from "./middleware";

describe("isPublicPath", () => {
  it("treats /login as public", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it("treats /register as public", () => {
    expect(isPublicPath("/register")).toBe(true);
  });

  it("treats other app routes as protected", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/loads")).toBe(false);
  });

  it("does not treat /login-like paths as public", () => {
    expect(isPublicPath("/login-history")).toBe(false);
  });
});

describe("updateSession", () => {
  it("redirects an unauthenticated request to /login", async () => {
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/login");
  });

  it("does not redirect an unauthenticated request to /login itself", async () => {
    const request = new NextRequest("https://example.test/login");

    const response = await updateSession(request);

    expect(response.status).not.toBe(307);
  });

  it("does not redirect an unauthenticated request to /register itself", async () => {
    const request = new NextRequest("https://example.test/register");

    const response = await updateSession(request);

    expect(response.status).not.toBe(307);
  });
});

describe("updateSession for an authenticated user", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "authenticated-user" } } }),
        },
      }),
    }));
  });

  it("redirects away from /login into the app", async () => {
    const { updateSession: updateSessionWithAuth } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/login");

    const response = await updateSessionWithAuth(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("redirects away from /register into the app", async () => {
    const { updateSession: updateSessionWithAuth } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/register");

    const response = await updateSessionWithAuth(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("does not redirect an authenticated request to a protected route", async () => {
    const { updateSession: updateSessionWithAuth } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSessionWithAuth(request);

    expect(response.status).not.toBe(307);
  });
});
