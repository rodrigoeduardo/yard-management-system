/**
 * Yard time zone. Entry date/time is always shown in Brazilian yard local
 * time, regardless of the timezone the server/runner happens to be in
 * (e.g. CI runs UTC, some hosts run UTC in production).
 */
export const YARD_TIME_ZONE = "America/Sao_Paulo";

/**
 * Fixed UTC offset (in minutes, ahead of UTC) for `YARD_TIME_ZONE`. Brazil
 * abolished daylight saving time nationally in 2019, so `America/Sao_Paulo`
 * has been a constant UTC-03:00 since then, making this fixed offset safe
 * for converting a yard wall-clock reading into an absolute instant.
 *
 * This is the single source of truth for the yard's UTC offset. Both
 * `combineEntryDateTime` (write path — `lib/loads/entry-datetime.ts`) and
 * `formatEntryDateTime` (read path, below) must agree on it, so that a
 * wall-clock entry round-trips through persistence unchanged regardless of
 * the host process's own default timezone.
 */
export const YARD_UTC_OFFSET_MINUTES = 3 * 60;

/**
 * Formats a `Date` as `dd/mm/aaaa · HH:mm` for display (mono UI treatment),
 * used everywhere an entry date/time is shown. Loads created before entry
 * time was captured still render fine — the timestamp is midnight UTC,
 * which renders as the previous day at 21:00 in the pinned yard timezone.
 *
 * The time zone is pinned explicitly so the result is deterministic
 * regardless of the host/runner timezone.
 */
export function formatEntryDateTime(date: Date): string {
  const datePart = date.toLocaleDateString("pt-BR", {
    timeZone: YARD_TIME_ZONE,
  });
  const timePart = date.toLocaleTimeString("pt-BR", {
    timeZone: YARD_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

/**
 * Formats a `Date` as `dd/mm/aaaa` (date only), pinned to `YARD_TIME_ZONE`.
 * Used anywhere a yard timestamp is shown as a date without a time, so the
 * calendar day matches what's shown elsewhere on the same screen (e.g.
 * `formatEntryDateTime`) regardless of the host/runner timezone.
 */
export function formatYardDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: YARD_TIME_ZONE,
  });
}

const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Formats a plain `YYYY-MM-DD` calendar date value (as stored in a
 * `date`-typed column, e.g. `loads.nfDate`) as `dd/mm/aaaa`. Unlike
 * `formatYardDate`, this never goes through a `Date` object or a `timeZone`
 * conversion — a calendar date has no time component to begin with, so
 * there is nothing to shift. That makes it safe by construction against the
 * host/runner timezone, which a `Date`-based formatter would need to pin
 * against (see `YARD_TIME_ZONE`).
 */
export function formatCalendarDate(value: string): string {
  const match = CALENDAR_DATE_RE.exec(value);
  if (!match) {
    return value;
  }
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
