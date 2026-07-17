import { describe, expect, it } from "vitest";
import { subtractDecimalStrings, sumDecimalStrings } from "./decimal";

describe("sumDecimalStrings", () => {
  it("sums integer-valued decimal strings", () => {
    expect(sumDecimalStrings(["10", "20", "30"])).toBe("60");
  });

  it("sums fractional decimal strings without floating-point drift", () => {
    expect(sumDecimalStrings(["10.1", "20.2"])).toBe("30.3");
  });

  it("returns 0 for an empty list", () => {
    expect(sumDecimalStrings([])).toBe("0");
  });
});

describe("subtractDecimalStrings", () => {
  it("subtracts integer-valued decimal strings", () => {
    expect(subtractDecimalStrings("30", "10")).toBe("20");
  });

  it("subtracts fractional decimal strings without floating-point drift", () => {
    expect(subtractDecimalStrings("30.3", "10.1")).toBe("20.2");
  });
});
