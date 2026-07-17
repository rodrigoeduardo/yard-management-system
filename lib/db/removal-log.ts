import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { items, loads, removalItems, removals } from "./schema";

export async function listRemovalsMostRecentFirst() {
  return db.select().from(removals).orderBy(desc(removals.createdAt));
}

export async function listRemovalNfs() {
  return db
    .select({
      removalId: removalItems.removalId,
      notaFiscal: loads.notaFiscal,
    })
    .from(removalItems)
    .innerJoin(items, eq(removalItems.itemId, items.id))
    .innerJoin(loads, eq(items.loadId, loads.id));
}
