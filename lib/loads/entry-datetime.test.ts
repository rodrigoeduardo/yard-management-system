import { afterEach, describe, expect, it } from "vitest";
import { formatEntryDateTime } from "@/lib/format/datetime";
import {
  combineEntryDateTime,
  combineEntryDateTimeValue,
  getCurrentEntryDateTimeValue,
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

describe("combineEntryDateTime + formatEntryDateTime round-trip", () => {
  // Regression guard for a prod-only bug: combineEntryDateTime (write path)
  // and formatEntryDateTime (read path) must agree on the yard's timezone
  // independent of the *host process's* default timezone, since nothing
  // outside this test suite pins the production runtime's TZ. A wall-clock
  // entry of "14:30 on 2026-07-17" must always redisplay as "14:30" no
  // matter whether the server process defaults to UTC, America/Sao_Paulo,
  // or something else entirely (e.g. Asia/Tokyo) — this test asserts that
  // explicitly across a small TZ matrix rather than relying solely on the
  // single TZ vitest.setup.ts pins for the whole suite.
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it.each(["UTC", "America/Sao_Paulo", "Asia/Tokyo"])(
    "round-trips a 14:30 Sao Paulo wall-clock entry under host TZ=%s",
    (hostTz) => {
      process.env.TZ = hostTz;

      const combined = combineEntryDateTime("2026-07-17", "14:30");
      expect(combined).not.toBeNull();
      expect(formatEntryDateTime(combined!)).toBe("17/07/2026 · 14:30");
    },
  );
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

describe("getCurrentEntryDateTimeValue", () => {
  it("formats a local date+time as YYYY-MM-DDTHH:mm for a datetime-local input", () => {
    const now = new Date(2026, 0, 5, 9, 3);
    expect(getCurrentEntryDateTimeValue(now)).toBe("2026-01-05T09:03");
  });
});

describe("combineEntryDateTimeValue", () => {
  it("splits a datetime-local value and delegates to combineEntryDateTime", () => {
    const combined = combineEntryDateTimeValue("2026-07-17T14:35");

    expect(combined).not.toBeNull();
    expect(combined?.getFullYear()).toBe(2026);
    expect(combined?.getMonth()).toBe(6);
    expect(combined?.getDate()).toBe(17);
    expect(combined?.getHours()).toBe(14);
    expect(combined?.getMinutes()).toBe(35);
    expect(combined).toEqual(combineEntryDateTime("2026-07-17", "14:35"));
  });

  it("returns null for a malformed datetime-local value", () => {
    expect(combineEntryDateTimeValue("2026-07-17 14:35")).toBeNull();
    expect(combineEntryDateTimeValue("2026-07-17")).toBeNull();
    expect(combineEntryDateTimeValue("")).toBeNull();
  });

  it("returns null for a datetime-local value with a non-existent calendar date", () => {
    expect(combineEntryDateTimeValue("2026-02-30T10:00")).toBeNull();
  });

  it("returns null for a datetime-local value with an out-of-range time", () => {
    expect(combineEntryDateTimeValue("2026-07-17T25:00")).toBeNull();
  });
});
