/**
 * Formats a `Date` as `dd/mm/aaaa · HH:mm` for display (mono UI treatment),
 * used everywhere an entry date/time is shown. Loads created before entry
 * time was captured still render fine — the timestamp is midnight UTC and
 * simply shows `00:00`.
 */
export function formatEntryDateTime(date: Date): string {
  const datePart = date.toLocaleDateString("pt-BR");
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}
