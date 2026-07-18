/**
 * Yard time zone. Entry date/time is always shown in Brazilian yard local
 * time, regardless of the timezone the server/runner happens to be in
 * (e.g. CI runs UTC, some hosts run UTC in production).
 */
const YARD_TIME_ZONE = "America/Sao_Paulo";

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
