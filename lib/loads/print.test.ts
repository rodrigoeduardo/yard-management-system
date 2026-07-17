import { describe, expect, it } from "vitest";
import { formatLoadSummary, isValidLoadId } from "./print";

describe("isValidLoadId", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidLoadId("5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a")).toBe(true);
  });

  it("rejects a malformed id", () => {
    expect(isValidLoadId("not-a-uuid")).toBe(false);
  });
});

describe("formatLoadSummary", () => {
  it("formats the load fields shown on the print page", () => {
    const summary = formatLoadSummary({
      notaFiscal: "NF-123",
      material: "Aço",
      entryDate: new Date("2026-03-05T12:00:00Z"),
      itemCount: 7,
    });

    expect(summary).toEqual({
      notaFiscal: "NF-123",
      material: "Aço",
      entryDate: "05/03/2026",
      itemCount: 7,
    });
  });
});
