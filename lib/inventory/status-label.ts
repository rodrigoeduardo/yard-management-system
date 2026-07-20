/**
 * Shared status-label text for the Estoque/Remoções sections, reflecting
 * the active order field/direction and whether filters are applied. Used by
 * both `stock-query.ts` and `removal-query.ts` so the two sections render
 * consistent wording.
 */
export function buildStatusLabel(
  orderLabel: string,
  dir: "asc" | "desc",
  filtersActive: boolean,
): string {
  const base = `Ordenado por ${orderLabel} (${dir})`;
  const withFilters = filtersActive ? `${base} · filtros ativos` : base;
  return `${withFilters} · somente visualização`;
}
