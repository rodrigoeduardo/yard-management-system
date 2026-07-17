import { asc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { items, loads, removalItems } from "./schema";

export type RemovalItemDetail = {
  id: string;
  identifier: string;
  weight: string;
  notaFiscal: string;
};

/** Items removed in a given removal, labeled with each item's originating NF (e.g. for the removal-detail modal). */
export async function getRemovalItems(
  removalId: string,
): Promise<RemovalItemDetail[]> {
  const removedItems = await db
    .select({
      id: items.id,
      weight: items.weight,
      loadId: items.loadId,
      createdAt: items.createdAt,
    })
    .from(removalItems)
    .innerJoin(items, eq(removalItems.itemId, items.id))
    .where(eq(removalItems.removalId, removalId))
    .orderBy(asc(items.createdAt));

  if (removedItems.length === 0) {
    return [];
  }

  const loadIds = [...new Set(removedItems.map((item) => item.loadId))];

  const [loadRows, allItemsInLoads] = await Promise.all([
    db
      .select({ id: loads.id, notaFiscal: loads.notaFiscal })
      .from(loads)
      .where(inArray(loads.id, loadIds)),
    db
      .select({ id: items.id, loadId: items.loadId })
      .from(items)
      .where(inArray(items.loadId, loadIds))
      .orderBy(asc(items.createdAt)),
  ]);

  const notaFiscalByLoadId = new Map(
    loadRows.map((load) => [load.id, load.notaFiscal]),
  );

  const indexByItemId = new Map<string, number>();
  const counters = new Map<string, number>();
  for (const item of allItemsInLoads) {
    const next = (counters.get(item.loadId) ?? 0) + 1;
    counters.set(item.loadId, next);
    indexByItemId.set(item.id, next);
  }

  return removedItems.map((item) => {
    const notaFiscal = notaFiscalByLoadId.get(item.loadId)!;
    return {
      id: item.id,
      identifier: `Item ${indexByItemId.get(item.id)} - ${notaFiscal}`,
      weight: item.weight,
      notaFiscal,
    };
  });
}
