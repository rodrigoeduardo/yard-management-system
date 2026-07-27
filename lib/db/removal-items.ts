import { asc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { items, loads, materials, removalItems } from "./schema";

export type RemovalItemDetail = {
  id: string;
  identifier: string;
  weight: string;
  notaFiscal: string;
  material: string;
};

/** Kept as an alias for callers written against the receipt-specific name. */
export type RemovalReceiptItemDetail = RemovalItemDetail;

/**
 * Shared core for `getRemovalItems`/`getRemovalReceiptItems`: resolves each
 * removed item's identifier, material and originating NF, indexed by the
 * item's position among *all* of its load's items (not just the removed
 * ones).
 */
async function getRemovalItemsWithMaterial(
  removalId: string,
): Promise<RemovalItemDetail[]> {
  const removedItems = await db
    .select({
      id: items.id,
      weight: items.weight,
      loadId: items.loadId,
    })
    .from(removalItems)
    .innerJoin(items, eq(removalItems.itemId, items.id))
    .where(eq(removalItems.removalId, removalId))
    .orderBy(asc(items.sequence));

  if (removedItems.length === 0) {
    return [];
  }

  const loadIds = [...new Set(removedItems.map((item) => item.loadId))];

  const [loadRows, allItemsInLoads] = await Promise.all([
    db
      .select({
        id: loads.id,
        notaFiscal: loads.notaFiscal,
        material: materials.name,
      })
      .from(loads)
      .innerJoin(materials, eq(loads.materialId, materials.id))
      .where(inArray(loads.id, loadIds)),
    db
      .select({ id: items.id, loadId: items.loadId })
      .from(items)
      .where(inArray(items.loadId, loadIds))
      .orderBy(asc(items.sequence)),
  ]);

  const loadById = new Map(loadRows.map((load) => [load.id, load]));

  const indexByItemId = new Map<string, number>();
  const counters = new Map<string, number>();
  for (const item of allItemsInLoads) {
    const next = (counters.get(item.loadId) ?? 0) + 1;
    counters.set(item.loadId, next);
    indexByItemId.set(item.id, next);
  }

  return removedItems.map((item) => {
    const load = loadById.get(item.loadId)!;
    return {
      id: item.id,
      identifier: `Item ${indexByItemId.get(item.id)} - ${load.notaFiscal}`,
      weight: item.weight,
      notaFiscal: load.notaFiscal,
      material: load.material,
    };
  });
}

/** Items removed in a given removal, each labeled with its identifier, material and originating NF (e.g. for the removal-detail modal). */
export async function getRemovalItems(
  removalId: string,
): Promise<RemovalItemDetail[]> {
  return getRemovalItemsWithMaterial(removalId);
}

/** Items removed in a given removal, each labeled with its originating NF and material (for the printable receipt, issue #270). */
export async function getRemovalReceiptItems(
  removalId: string,
): Promise<RemovalReceiptItemDetail[]> {
  return getRemovalItemsWithMaterial(removalId);
}
