/**
 * Formats a weight value in kilograms as `{value} kg`, used everywhere a
 * weight is displayed on the Estoque page (stock/removal cards and tables,
 * detail modals) so the unit is never ambiguous. Accepts a numeric string
 * since weights are stored and read as `numeric` decimal strings from the
 * database layer.
 */
export function formatWeightKg(value: string | number): string {
  return `${value} kg`;
}
