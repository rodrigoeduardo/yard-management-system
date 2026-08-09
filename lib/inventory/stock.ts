export function isLoadFinished(load: {
  itemCount: number;
  remainingWeight: string;
}): boolean {
  return load.itemCount === 0 && Number(load.remainingWeight) === 0;
}

/**
 * The three-tier removal-progress state used to colour a stock row/card:
 * - `none-removed` — nothing removed yet (green treatment)
 * - `partial` — some items removed, load not yet finished (yellow treatment)
 * - `finished` — the load is finished, see `isLoadFinished` (red treatment)
 *
 * Single source of truth for both `stock-table.tsx` and `stock-card.tsx` so
 * they cannot drift.
 */
export type StockTier = "none-removed" | "partial" | "finished";

export function getStockTier(load: {
  itemCount: number;
  remainingWeight: string;
  removedItemCount: number;
}): StockTier {
  if (isLoadFinished(load)) return "finished";
  if (load.removedItemCount > 0) return "partial";
  return "none-removed";
}
