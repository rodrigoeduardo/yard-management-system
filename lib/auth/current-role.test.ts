import { describe, expect, it, vi } from "vitest";

function fakeCookieStore() {
  return {
    getAll: () => [],
    set: () => {},
  };
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => fakeCookieStore()),
}));

const getUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/ssr-server", () => ({
  createSupabaseSsrServerClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

describe("getCurrentUserRole", () => {
  it("resolves to viewer when the session's user_metadata.app_role is viewer", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { user_metadata: { app_role: "viewer" } } },
    });
    const { getCurrentUserRole } = await import("./current-role");

    await expect(getCurrentUserRole()).resolves.toBe("viewer");
  });

  it("resolves to operator when app_role is absent (backwards compatible)", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { user_metadata: {} } },
    });
    const { getCurrentUserRole } = await import("./current-role");

    await expect(getCurrentUserRole()).resolves.toBe("operator");
  });

  it("resolves to operator when there is no session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { getCurrentUserRole } = await import("./current-role");

    await expect(getCurrentUserRole()).resolves.toBe("operator");
  });

  it("resolves to operator for any app_role value other than viewer", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { user_metadata: { app_role: "admin" } } },
    });
    const { getCurrentUserRole } = await import("./current-role");

    await expect(getCurrentUserRole()).resolves.toBe("operator");
  });
});
