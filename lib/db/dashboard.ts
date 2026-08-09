import { desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./index";
import { items, loads, materials, removalItems, removals } from "./schema";

export type DashboardStats = {
  /** Count of loads that are not yet fully removed. */
  activeLoads: number;
  /** Count of distinct materials with at least one `in_stock` item. */
  materialsInStock: number;
  /** Sum of remaining_weight across all loads, as a decimal string. */
  remainingWeight: string;
};

/**
 * Read-only aggregate over `loads`/`items` for the home dashboard stat
 * cards. A load counts as active when it isn't finished (mirrors
 * `lib/inventory/stock.ts#isLoadFinished`: item_count = 0 and
 * remaining_weight = 0). `materialsInStock` is queried separately (joining
 * `items`) so its per-item fan-out can't skew the `loads`-only aggregates.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [loadsRow] = await db
    .select({
      activeLoads: sql<number>`count(*) filter (where ${loads.itemCount} > 0 or ${loads.remainingWeight} > 0)::int`,
      remainingWeight: sql<string>`coalesce(sum(${loads.remainingWeight}), 0)::text`,
    })
    .from(loads);

  const [materialsRow] = await db
    .select({
      materialsInStock: sql<number>`count(distinct ${loads.materialId})::int`,
    })
    .from(items)
    .innerJoin(loads, eq(items.loadId, loads.id))
    .where(eq(items.status, "in_stock"));

  return {
    activeLoads: loadsRow.activeLoads,
    materialsInStock: materialsRow.materialsInStock,
    remainingWeight: loadsRow.remainingWeight,
  };
}

export type LastRemoval = {
  id: string;
  exitDate: Date;
  driver: string;
  vehiclePlate: string | null;
  itemCount: number;
  totalRemovedWeight: string;
  notasFiscais: string[];
};

/**
 * Most-recent removal for the "última movimentação" card, with its item
 * count and NFs derived from the removal_items junction (read-only).
 * Returns null when no removal has happened yet. Cancelled removals
 * (issue #310) are skipped — their items are back in stock, so showing one
 * as the "last removal" would misrepresent the current state.
 */
export async function getLastRemoval(): Promise<LastRemoval | null> {
  const [removal] = await db
    .select()
    .from(removals)
    .where(isNull(removals.cancelledAt))
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
    vehiclePlate: removal.vehiclePlate,
    itemCount: nfRows.length,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais,
  };
}

export type LastLoad = {
  id: string;
  notaFiscal: string;
  material: string;
  entryDate: Date;
  nfWeight: string;
};

/**
 * Most-recent load for the "última movimentação" card (intake side).
 * Returns null when no load has been created yet.
 */
export async function getLastLoad(): Promise<LastLoad | null> {
  const [load] = await db
    .select({
      id: loads.id,
      notaFiscal: loads.notaFiscal,
      material: materials.name,
      entryDate: loads.entryDate,
      nfWeight: loads.nfWeight,
    })
    .from(loads)
    .innerJoin(materials, eq(loads.materialId, materials.id))
    .orderBy(desc(loads.createdAt))
    .limit(1);

  if (!load) {
    return null;
  }

  return load;
}
