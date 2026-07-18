import { describe, expect, it } from "vitest";
import {
  combineEntryDateTime,
  getCurrentEntryDateValue,
  getCurrentEntryTimeValue,
} from "./entry-datetime";

describe("combineEntryDateTime", () => {
  it("preserves the chosen hour and minute instead of forcing midnight", () => {
    const combined = combineEntryDateTime("2026-07-17", "14:35");

    expect(combined).not.toBeNull();
    expect(combined?.getFullYear()).toBe(2026);
    expect(combined?.getMonth()).toBe(6);
    expect(combined?.getDate()).toBe(17);
    expect(combined?.getHours()).toBe(14);
    expect(combined?.getMinutes()).toBe(35);
  });

  it("accepts midnight explicitly (00:00) as a valid, deliberate time", () => {
    const combined = combineEntryDateTime("2026-07-17", "00:00");

    expect(combined).not.toBeNull();
    expect(combined?.getHours()).toBe(0);
    expect(combined?.getMinutes()).toBe(0);
  });

  it("returns null for a malformed date value", () => {
    expect(combineEntryDateTime("17/07/2026", "14:35")).toBeNull();
    expect(combineEntryDateTime("", "14:35")).toBeNull();
  });

  it("returns null for a malformed time value", () => {
    expect(combineEntryDateTime("2026-07-17", "2:35pm")).toBeNull();
    expect(combineEntryDateTime("2026-07-17", "")).toBeNull();
  });

  it("returns null for a calendar date that does not exist", () => {
    expect(combineEntryDateTime("2026-02-30", "10:00")).toBeNull();
  });

  it("returns null for an out-of-range time", () => {
    expect(combineEntryDateTime("2026-07-17", "25:00")).toBeNull();
    expect(combineEntryDateTime("2026-07-17", "10:61")).toBeNull();
  });
});

describe("getCurrentEntryDateValue", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    const now = new Date(2026, 0, 5, 9, 3);
    expect(getCurrentEntryDateValue(now)).toBe("2026-01-05");
  });
});

describe("getCurrentEntryTimeValue", () => {
  it("formats a local time as HH:mm, zero-padded", () => {
    const now = new Date(2026, 0, 5, 9, 3);
    expect(getCurrentEntryTimeValue(now)).toBe("09:03");
  });
});
