import { describe, expect, it } from "vitest";
import {
  formatRemovalReceiptSummary,
  isReceiptPrintRoute,
  isValidRemovalId,
} from "./print";

describe("isValidRemovalId", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidRemovalId("5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a")).toBe(
      true,
    );
  });

  it("rejects a malformed id", () => {
    expect(isValidRemovalId("not-a-uuid")).toBe(false);
  });
});

describe("isReceiptPrintRoute", () => {
  it("matches the receipt print page for a given removal id", () => {
    expect(
      isReceiptPrintRoute(
        "/removals/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a/receipt",
      ),
    ).toBe(true);
  });

  it("does not match other removal routes", () => {
    expect(
      isReceiptPrintRoute("/removals/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a"),
    ).toBe(false);
    expect(isReceiptPrintRoute("/removals/new")).toBe(false);
  });

  it("does not match unrelated routes", () => {
    expect(isReceiptPrintRoute("/inventory")).toBe(false);
    expect(isReceiptPrintRoute("/")).toBe(false);
  });
});

describe("formatRemovalReceiptSummary", () => {
  it("formats the removal fields shown on the receipt", () => {
    const summary = formatRemovalReceiptSummary({
      exitDate: new Date("2026-03-05T12:00:00Z"),
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      totalRemovedWeight: "15.5",
      cancelledAt: null,
    });

    expect(summary).toEqual({
      exitDate: "05/03/2026 · 09:00",
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      totalRemovedWeight: "15.5 Ton",
      cancelledAt: null,
    });
  });

  it("shows an em dash for a legacy removal without a vehicle plate", () => {
    const summary = formatRemovalReceiptSummary({
      exitDate: new Date("2026-03-05T12:00:00Z"),
      driver: "John Doe",
      vehiclePlate: null,
      totalRemovedWeight: "15.5",
      cancelledAt: null,
    });

    expect(summary.vehiclePlate).toBe("—");
  });

  it("formats the cancellation timestamp for a cancelled removal (issue #311)", () => {
    const summary = formatRemovalReceiptSummary({
      exitDate: new Date("2026-03-05T12:00:00Z"),
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      totalRemovedWeight: "15.5",
      cancelledAt: new Date("2026-03-06T15:30:00Z"),
    });

    expect(summary.cancelledAt).toBe("06/03/2026 · 12:30");
  });

  it("leaves cancelledAt null for an active (non-cancelled) removal", () => {
    const summary = formatRemovalReceiptSummary({
      exitDate: new Date("2026-03-05T12:00:00Z"),
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      totalRemovedWeight: "15.5",
      cancelledAt: null,
    });

    expect(summary.cancelledAt).toBeNull();
  });
});
