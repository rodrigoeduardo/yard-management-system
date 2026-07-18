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
 * `<input type="date">` / `<input type="time">`) into a single local `Date`,
 * preserving the chosen hour/minute instead of forcing midnight. Returns
 * `null` when either value is malformed or does not denote a real date/time
 * (e.g. 2026-02-30, or 25:00).
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

  const combined = new Date(year, month - 1, day, hour, minute, 0, 0);

  const isRealDateTime =
    combined.getFullYear() === year &&
    combined.getMonth() === month - 1 &&
    combined.getDate() === day &&
    combined.getHours() === hour &&
    combined.getMinutes() === minute;

  return isRealDateTime ? combined : null;
}
