import { asc, eq } from "drizzle-orm";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { items, loads } from "./schema";

export type CreateLoadData = {
  notaFiscal: string;
  entryDate: Date;
  nfWeight: string;
  material: string;
  itemWeights: string[];
};

export async function insertLoadWithItems(data: CreateLoadData) {
  const remainingWeight = sumDecimalStrings(data.itemWeights);

  return db.transaction(async (tx) => {
    const [load] = await tx
      .insert(loads)
      .values({
        notaFiscal: data.notaFiscal,
        entryDate: data.entryDate,
        nfWeight: data.nfWeight,
        material: data.material,
        itemCount: data.itemWeights.length,
        remainingWeight,
      })
      .returning();

    await tx.insert(items).values(
      data.itemWeights.map((weight) => ({
        loadId: load.id,
        weight,
      })),
    );

    return load;
  });
}

export async function getLoadWithItems(loadId: string) {
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId));
  const loadItems = await db
    .select()
    .from(items)
    .where(eq(items.loadId, loadId))
    .orderBy(asc(items.createdAt));

  return { load, items: loadItems };
}
