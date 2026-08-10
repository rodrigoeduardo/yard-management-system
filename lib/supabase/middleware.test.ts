import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("updateSession for a viewer session", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({
            data: {
              user: {
                id: "viewer-user",
                user_metadata: { app_role: "viewer" },
              },
            },
          }),
        },
      }),
    }));
  });

  it("redirects /loads/new to /inventory with a notice", async () => {
    const { updateSession: updateSessionAsViewer } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/loads/new");

    const response = await updateSessionAsViewer(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.test/inventory?notice=viewer-restricted",
    );
  });

  it("redirects /removals/new to /inventory with a notice", async () => {
    const { updateSession: updateSessionAsViewer } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/removals/new");

    const response = await updateSessionAsViewer(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.test/inventory?notice=viewer-restricted",
    );
  });

  it("does not redirect a viewer away from read routes", async () => {
    const { updateSession: updateSessionAsViewer } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/inventory");

    const response = await updateSessionAsViewer(request);

    expect(response.status).not.toBe(307);
  });
});

describe("updateSession for an operator session and a write route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: "operator-user", user_metadata: {} } },
          }),
        },
      }),
    }));
  });

  it("does not redirect an operator away from /loads/new", async () => {
    const { updateSession: updateSessionAsOperator } = await import(
      "./middleware"
    );
    const request = new NextRequest("https://example.test/loads/new");

    const response = await updateSessionAsOperator(request);

    expect(response.status).not.toBe(307);
  });
});

describe("updateSession in DEMO_MODE", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@supabase/ssr");
    process.env.DEMO_MODE = "true";
    process.env.DEMO_USER_EMAIL = "demo@example.test";
    process.env.DEMO_USER_PASSWORD = "demo-password";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("does not sign in when DEMO_MODE is unset (control case stays on real /login)", async () => {
    delete process.env.DEMO_MODE;
    const { updateSession: updateSessionUnset } = await import("./middleware");
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSessionUnset(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/login");
  });

  it("redirects /login into the app without showing auth UI", async () => {
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null } }),
          signInWithPassword: async () => ({
            data: { user: { id: "demo-user" } },
            error: null,
          }),
        },
      }),
    }));
    const { updateSession: updateSessionDemo } = await import("./middleware");
    const request = new NextRequest("https://example.test/login");

    const response = await updateSessionDemo(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("redirects /register into the app without showing auth UI", async () => {
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null } }),
          signInWithPassword: async () => ({
            data: { user: { id: "demo-user" } },
            error: null,
          }),
        },
      }),
    }));
    const { updateSession: updateSessionDemo } = await import("./middleware");
    const request = new NextRequest("https://example.test/register");

    const response = await updateSessionDemo(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/");
  });

  it("transparently signs an unauthenticated visitor in as the demo user instead of redirecting to /login", async () => {
    const signInWithPassword = vi.fn(async () => ({
      data: { user: { id: "demo-user" } },
      error: null,
    }));
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null } }),
          signInWithPassword,
        },
      }),
    }));
    const { updateSession: updateSessionDemo } = await import("./middleware");
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSessionDemo(request);

    expect(response.status).not.toBe(307);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "demo@example.test",
      password: "demo-password",
    });
  });

  it("does not attempt to sign in again for an already-authenticated demo session", async () => {
    const signInWithPassword = vi.fn();
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "demo-user" } } }),
          signInWithPassword,
        },
      }),
    }));
    const { updateSession: updateSessionDemo } = await import("./middleware");
    const request = new NextRequest("https://example.test/loads");

    const response = await updateSessionDemo(request);

    expect(response.status).not.toBe(307);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
