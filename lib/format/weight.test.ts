import { describe, expect, it } from "vitest";
import { formatWeight } from "./weight";

describe("formatWeight", () => {
  it("appends the t unit to a positive value", () => {
    expect(formatWeight(2000)).toBe("2000 t");
  });

  it("appends the t unit to zero", () => {
    expect(formatWeight(0)).toBe("0 t");
  });

  it("preserves decimal values", () => {
    expect(formatWeight(12.5)).toBe("12.5 t");
  });

  it("accepts a numeric string, as returned by the database layer", () => {
    expect(formatWeight("2000")).toBe("2000 t");
  });

  it("accepts a decimal numeric string", () => {
    expect(formatWeight("12.5")).toBe("12.5 t");
  });
});
