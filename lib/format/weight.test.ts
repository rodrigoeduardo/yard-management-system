import { describe, expect, it } from "vitest";
import { formatWeightKg } from "./weight";

describe("formatWeightKg", () => {
  it("appends the kg unit to a positive value", () => {
    expect(formatWeightKg(2000)).toBe("2000 kg");
  });

  it("appends the kg unit to zero", () => {
    expect(formatWeightKg(0)).toBe("0 kg");
  });

  it("preserves decimal values", () => {
    expect(formatWeightKg(12.5)).toBe("12.5 kg");
  });
});
