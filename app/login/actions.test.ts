import { afterEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

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

const cookieStore = fakeCookieStore();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

describe("login action", () => {
  afterEach(() => {
    redirectMock.mockClear();
  });

  it("redirects to /login with an input error when the email is malformed", async () => {
    const { login } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "irrelevant");

    await expect(login(formData)).rejects.toThrow("REDIRECT:/login?error=invalid_input");
  });

  it("redirects to /login with an auth error on wrong credentials", async () => {
    const { login } = await import("./actions");
    const formData = new FormData();
    formData.set("email", requireTestEnv("TEST_USER_EMAIL"));
    formData.set("password", "definitely-wrong-password");

    await expect(login(formData)).rejects.toThrow(
      "REDIRECT:/login?error=invalid_credentials",
    );
  });

  it("redirects to / on successful login", async () => {
    const { login } = await import("./actions");
    const formData = new FormData();
    formData.set("email", requireTestEnv("TEST_USER_EMAIL"));
    formData.set("password", requireTestEnv("TEST_USER_PASSWORD"));

    await expect(login(formData)).rejects.toThrow("REDIRECT:/");
  });
});

describe("logout action", () => {
  afterEach(() => {
    redirectMock.mockClear();
  });

  it("redirects to /login", async () => {
    const { logout } = await import("./actions");

    await expect(logout()).rejects.toThrow("REDIRECT:/login");
  });
});
