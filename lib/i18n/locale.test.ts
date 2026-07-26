import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "./locale";

describe("locale", () => {
  it("lists pt-BR and en as the supported locales", () => {
    expect(locales).toEqual(["pt-BR", "en"]);
  });

  it("defaults to pt-BR", () => {
    expect(defaultLocale).toBe("pt-BR");
  });

  describe("isLocale", () => {
    it("accepts every supported locale", () => {
      for (const locale of locales) {
        expect(isLocale(locale)).toBe(true);
      }
    });

    it("rejects unsupported values", () => {
      expect(isLocale("fr")).toBe(false);
      expect(isLocale(undefined)).toBe(false);
      expect(isLocale(null)).toBe(false);
      expect(isLocale("")).toBe(false);
    });
  });
});
