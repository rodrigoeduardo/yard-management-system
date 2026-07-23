import { describe, expect, it } from "vitest";
import { formatLoadSummary, isQrPrintRoute, isValidLoadId } from "./print";

describe("isValidLoadId", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidLoadId("5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a")).toBe(true);
  });

  it("rejects a malformed id", () => {
    expect(isValidLoadId("not-a-uuid")).toBe(false);
  });
});

describe("isQrPrintRoute", () => {
  it("matches the QR print page for a given load id", () => {
    expect(isQrPrintRoute("/loads/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a/print")).toBe(true);
  });

  it("does not match other load routes", () => {
    expect(isQrPrintRoute("/loads/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a")).toBe(false);
    expect(isQrPrintRoute("/loads/new")).toBe(false);
  });

  it("does not match unrelated routes", () => {
    expect(isQrPrintRoute("/inventory")).toBe(false);
    expect(isQrPrintRoute("/")).toBe(false);
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
      entryDate: "05/03/2026 · 09:00",
      itemCount: 7,
    });
  });
});
