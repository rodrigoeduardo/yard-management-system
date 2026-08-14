import { asc, eq } from "drizzle-orm";
import { db } from "./index";
import { items, loads } from "./schema";

export type LoadItemDetail = {
  id: string;
  identifier: string;
  weight: string;
  status: "in_stock" | "removed";
};

/** Items belonging to a load, labeled for display (e.g. in the load-detail modal). */
export async function getLoadItems(loadId: string): Promise<LoadItemDetail[]> {
  const [load] = await db
    .select({ notaFiscal: loads.notaFiscal })
    .from(loads)
    .where(eq(loads.id, loadId));

  if (!load) {
    return [];
  }

  const loadItems = await db
    .select()
    .from(items)
    .where(eq(items.loadId, loadId))
    .orderBy(asc(items.number));

  return loadItems.map((item) => ({
    id: item.id,
    identifier: `Item ${item.number} - ${load.notaFiscal}`,
    weight: item.weight,
    status: item.status,
  }));
}
