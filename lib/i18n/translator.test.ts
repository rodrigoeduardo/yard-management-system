import { describe, expect, it } from "vitest";
import { createTranslator } from "./translator";

const dictionary = {
  greeting: "Olá",
  nested: {
    label: "Rótulo",
  },
};

describe("createTranslator", () => {
  it("resolves a top-level key", () => {
    const t = createTranslator(dictionary);
    expect(t("greeting")).toBe("Olá");
  });

  it("resolves a nested dot-path key", () => {
    const t = createTranslator(dictionary);
    expect(t("nested.label")).toBe("Rótulo");
  });

  it("throws on a key that does not resolve to a string", () => {
    const t = createTranslator(dictionary);
    // @ts-expect-error - "missing" is not a valid key of `dictionary`
    expect(() => t("missing")).toThrow('Missing i18n key: "missing"');
  });

  it("throws on a key that resolves to a nested object, not a string", () => {
    const t = createTranslator(dictionary);
    // @ts-expect-error - "nested" resolves to an object, not a string leaf
    expect(() => t("nested")).toThrow('Missing i18n key: "nested"');
  });
});
