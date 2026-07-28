import { describe, expect, it } from "vitest";
import { formatWeight } from "./weight";

describe("formatWeight", () => {
  it("appends the Ton unit to a positive value", () => {
    expect(formatWeight(2000)).toBe("2000 Ton");
  });

  it("appends the Ton unit to zero", () => {
    expect(formatWeight(0)).toBe("0 Ton");
  });

  it("preserves decimal values", () => {
    expect(formatWeight(12.5)).toBe("12.5 Ton");
  });

  it("accepts a numeric string, as returned by the database layer", () => {
    expect(formatWeight("2000")).toBe("2000 Ton");
  });

  it("accepts a decimal numeric string", () => {
    expect(formatWeight("12.5")).toBe("12.5 Ton");
  });
});
