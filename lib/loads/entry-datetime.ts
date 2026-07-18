import { YARD_UTC_OFFSET_MINUTES } from "@/lib/format/datetime";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local (browser/server) date formatted for an `<input type="date">` default value. */
export function getCurrentEntryDateValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Local (browser/server) time formatted for an `<input type="time">` default value. */
export function getCurrentEntryTimeValue(now: Date = new Date()): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Combines a `YYYY-MM-DD` date value and an `HH:mm` time value (as produced by
 * `<input type="date">` / `<input type="time">`), both understood as a
 * wall-clock reading in the yard's timezone (`YARD_TIME_ZONE`, pinned in
 * `lib/format/datetime.ts`), into the absolute instant `Date` that reading
 * denotes. Returns `null` when either value is malformed or does not denote
 * a real date/time (e.g. 2026-02-30, or 25:00).
 *
 * The instant is computed from the wall-clock components plus the yard's
 * fixed UTC offset (`YARD_UTC_OFFSET_MINUTES`) rather than via
 * `new Date(y, m, d, h, min)`, which would be interpreted in whatever
 * timezone the *host process* happens to default to — not necessarily the
 * yard's. That host-dependent construction previously desynced this write
 * path from `formatEntryDateTime`'s read path, which is always pinned to
 * `America/Sao_Paulo`: on a host defaulting to UTC, an entry of 14:30 would
 * persist as 14:30Z and then redisplay as 11:30. Computing the instant
 * directly from the shared fixed offset keeps write and read symmetric
 * regardless of the host's default timezone.
 */
export function combineEntryDateTime(
  dateValue: string,
  timeValue: string,
): Date | null {
  const dateMatch = DATE_RE.exec(dateValue);
  const timeMatch = TIME_RE.exec(timeValue);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  // Validate the calendar/time components using UTC-based construction so
  // the rollover check (e.g. 2026-02-30, or 25:00) is itself independent of
  // the host's default timezone.
  const utcNaive = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  const isRealDateTime =
    utcNaive.getUTCFullYear() === year &&
    utcNaive.getUTCMonth() === month - 1 &&
    utcNaive.getUTCDate() === day &&
    utcNaive.getUTCHours() === hour &&
    utcNaive.getUTCMinutes() === minute;

  if (!isRealDateTime) {
    return null;
  }

  // `utcNaive` currently treats the entered wall-clock as if it were UTC.
  // Shift by the yard's fixed UTC offset to get the actual instant that
  // wall-clock reading denotes in the yard's timezone.
  return new Date(utcNaive.getTime() + YARD_UTC_OFFSET_MINUTES * 60_000);
}
