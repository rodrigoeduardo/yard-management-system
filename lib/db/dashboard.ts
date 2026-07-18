import { desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { items, loads, removalItems, removals } from "./schema";

export type DashboardStats = {
  /** Count of loads that are not yet fully removed. */
  activeLoads: number;
  /** Sum of item_count across all loads. */
  itemsInStock: number;
  /** Sum of remaining_weight across all loads, as a decimal string. */
  remainingWeight: string;
};

/**
 * Read-only aggregate over `loads` for the home dashboard stat cards. A
 * load counts as active when it isn't finished (mirrors
 * `lib/inventory/stock.ts#isLoadFinished`: item_count = 0 and
 * remaining_weight = 0).
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [row] = await db
    .select({
      activeLoads: sql<number>`count(*) filter (where ${loads.itemCount} > 0 or ${loads.remainingWeight} > 0)::int`,
      itemsInStock: sql<number>`coalesce(sum(${loads.itemCount}), 0)::int`,
      remainingWeight: sql<string>`coalesce(sum(${loads.remainingWeight}), 0)::text`,
    })
    .from(loads);

  return row;
}

export type LastRemoval = {
  id: string;
  exitDate: Date;
  driver: string;
  itemCount: number;
  totalRemovedWeight: string;
  notasFiscais: string[];
};

/**
 * Most-recent removal for the "última movimentação" card, with its item
 * count and NFs derived from the removal_items junction (read-only).
 * Returns null when no removal has happened yet.
 */
export async function getLastRemoval(): Promise<LastRemoval | null> {
  const [removal] = await db
    .select()
    .from(removals)
    .orderBy(desc(removals.createdAt))
    .limit(1);

  if (!removal) {
    return null;
  }

  const nfRows = await db
    .select({ notaFiscal: loads.notaFiscal })
    .from(removalItems)
    .innerJoin(items, eq(removalItems.itemId, items.id))
    .innerJoin(loads, eq(items.loadId, loads.id))
    .where(eq(removalItems.removalId, removal.id));

  const notasFiscais = Array.from(new Set(nfRows.map((row) => row.notaFiscal)));

  return {
    id: removal.id,
    exitDate: removal.exitDate,
    driver: removal.driver,
    itemCount: nfRows.length,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais,
  };
}
