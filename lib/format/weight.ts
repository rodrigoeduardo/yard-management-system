/**
 * Formats a weight value in kilograms as `{value} kg`, used everywhere a
 * weight is displayed on the Estoque page (stock/removal cards and tables,
 * detail modals) so the unit is never ambiguous.
 */
export function formatWeightKg(value: number): string {
  return `${value} kg`;
}
