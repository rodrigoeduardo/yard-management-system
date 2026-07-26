import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
const headerStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name) } : undefined,
  })),
  headers: vi.fn(async () => ({
    get: (name: string) => headerStore.get(name) ?? null,
  })),
}));

const { getLocale, LOCALE_COOKIE } = await import("./get-locale");

describe("getLocale", () => {
  beforeEach(() => {
    cookieStore.clear();
    headerStore.clear();
  });

  it("falls back to pt-BR when neither cookie nor header is present", async () => {
    expect(await getLocale()).toBe("pt-BR");
  });

  it("uses the Accept-Language header when it prefers English", async () => {
    headerStore.set("accept-language", "en-US,en;q=0.9");
    expect(await getLocale()).toBe("en");
  });

  it("falls back to pt-BR for a non-English Accept-Language header", async () => {
    headerStore.set("accept-language", "fr-FR,fr;q=0.9");
    expect(await getLocale()).toBe("pt-BR");
  });

  it("prefers the NEXT_LOCALE cookie over the Accept-Language header", async () => {
    cookieStore.set(LOCALE_COOKIE, "en");
    headerStore.set("accept-language", "fr-FR");
    expect(await getLocale()).toBe("en");
  });

  it("ignores an invalid cookie value and falls back to header/default detection", async () => {
    cookieStore.set(LOCALE_COOKIE, "fr");
    expect(await getLocale()).toBe("pt-BR");
  });
});
