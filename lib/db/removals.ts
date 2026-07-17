import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { items, loads, removalItems, removals } from "./schema";

export type CreateRemovalData = {
  exitDate: Date;
  driver: string;
  qrTokens: string[];
};

export async function removeScannedItems(data: CreateRemovalData) {
  return db.transaction(async (tx) => {
    const scannedItems = await tx
      .select()
      .from(items)
      .where(inArray(items.qrToken, data.qrTokens));

    if (scannedItems.length !== data.qrTokens.length) {
      throw new Error("One or more scanned items were not found");
    }
    if (scannedItems.some((item) => item.status === "removed")) {
      throw new Error("One or more scanned items have already been removed");
    }

    const totalRemovedWeight = scannedItems
      .reduce((sum, item) => sum + Number(item.weight), 0)
      .toString();

    const [removal] = await tx
      .insert(removals)
      .values({
        exitDate: data.exitDate,
        driver: data.driver,
        totalRemovedWeight,
      })
      .returning();

    await tx.insert(removalItems).values(
      scannedItems.map((item) => ({
        removalId: removal.id,
        itemId: item.id,
      })),
    );

    await tx
      .update(items)
      .set({ status: "removed" })
      .where(
        inArray(
          items.id,
          scannedItems.map((item) => item.id),
        ),
      );

    const removedByLoad = new Map<string, { count: number; weight: number }>();
    for (const item of scannedItems) {
      const entry = removedByLoad.get(item.loadId) ?? {
        count: 0,
        weight: 0,
      };
      entry.count += 1;
      entry.weight += Number(item.weight);
      removedByLoad.set(item.loadId, entry);
    }

    for (const [loadId, { count, weight }] of removedByLoad) {
      const [load] = await tx
        .select()
        .from(loads)
        .where(eq(loads.id, loadId));

      await tx
        .update(loads)
        .set({
          itemCount: load.itemCount - count,
          remainingWeight: (Number(load.remainingWeight) - weight).toString(),
        })
        .where(eq(loads.id, loadId));
    }

    return removal;
  });
}
