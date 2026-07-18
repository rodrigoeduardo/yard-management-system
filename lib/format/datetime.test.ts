import { describe, expect, it } from "vitest";
import { formatEntryDateTime } from "./datetime";

describe("formatEntryDateTime", () => {
  it("formats as dd/mm/aaaa · HH:mm", () => {
    const date = new Date(2026, 6, 17, 14, 5);
    expect(formatEntryDateTime(date)).toBe("17/07/2026 · 14:05");
  });

  it("zero-pads a single-digit hour and minute", () => {
    const date = new Date(2026, 0, 1, 4, 9);
    expect(formatEntryDateTime(date)).toBe("01/01/2026 · 04:09");
  });

  it("renders a midnight (legacy) timestamp without error", () => {
    const date = new Date(2026, 0, 1, 0, 0);
    expect(formatEntryDateTime(date)).toBe("01/01/2026 · 00:00");
  });
});
