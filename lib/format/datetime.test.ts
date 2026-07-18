import { describe, expect, it } from "vitest";
import { formatEntryDateTime, formatYardDate } from "./datetime";

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

describe("formatYardDate", () => {
  it("formats as dd/mm/aaaa", () => {
    const date = new Date(2026, 6, 17, 14, 5);
    expect(formatYardDate(date)).toBe("17/07/2026");
  });

  it("renders the same calendar day regardless of host timezone", () => {
    // 2026-07-17 23:30 in America/Sao_Paulo (UTC-03:00) is
    // 2026-07-18 02:30Z — a naive `toLocaleDateString()` without a pinned
    // timeZone would render 18/07/2026 on a UTC host.
    const date = new Date("2026-07-18T02:30:00Z");
    expect(formatYardDate(date)).toBe("17/07/2026");
  });
});
