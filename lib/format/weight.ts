/**
 * Formats a weight value as `{value} Ton` (tonnes), used everywhere a weight
 * is displayed on the Estoque page (stock/removal cards and tables, detail
 * modals) so the unit is never ambiguous. Accepts a numeric string since
 * weights are stored and read as `numeric` decimal strings from the
 * database layer.
 *
 * This is a display re-label only — stored values are not numerically
 * converted (e.g. a load stored with weight 12.5 renders "12.5 Ton").
 */
export function formatWeight(value: string | number): string {
  return `${value} Ton`;
}
