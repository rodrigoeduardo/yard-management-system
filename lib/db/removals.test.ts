import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { removeScannedItems } from "./removals";
import { items, loads, removalItems, removals } from "./schema";

async function insertLoadWithItems(itemWeights: string[]) {
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      material: "Aço",
      itemCount: itemWeights.length,
      remainingWeight: itemWeights
        .reduce((sum, w) => sum + Number(w), 0)
        .toString(),
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(itemWeights.map((weight) => ({ loadId: load.id, weight })))
    .returning();

  return { load, items: insertedItems };
}

describe("removeScannedItems", () => {
  const loadIds: string[] = [];
  const removalIds: string[] = [];

  afterEach(async () => {
    while (removalIds.length > 0) {
      const id = removalIds.pop()!;
      await db.delete(removalItems).where(eq(removalItems.removalId, id));
      await db.delete(removals).where(eq(removals.id, id));
    }
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it(
    "removes items spanning two different loads in one transaction",
    async () => {
    const loadA = await insertLoadWithItems(["10", "20"]);
    const loadB = await insertLoadWithItems(["5"]);
    loadIds.push(loadA.load.id, loadB.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "John Doe",
      qrTokens: [
        loadA.items[0].qrToken,
        loadB.items[0].qrToken,
      ],
    });
    removalIds.push(removal.id);

    expect(removal.totalRemovedWeight).toBe("15");

    const removedItemA = await db
      .select()
      .from(items)
      .where(eq(items.id, loadA.items[0].id));
    expect(removedItemA[0].status).toBe("removed");

    const untouchedItemA = await db
      .select()
      .from(items)
      .where(eq(items.id, loadA.items[1].id));
    expect(untouchedItemA[0].status).toBe("in_stock");

    const reloadedLoadA = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadA.load.id));
    expect(reloadedLoadA[0].itemCount).toBe(1);
    expect(reloadedLoadA[0].remainingWeight).toBe("20");

    const reloadedLoadB = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadB.load.id));
    expect(reloadedLoadB[0].itemCount).toBe(0);
    expect(reloadedLoadB[0].remainingWeight).toBe("0");

    const junctionRows = await db
      .select()
      .from(removalItems)
      .where(eq(removalItems.removalId, removal.id));
    expect(junctionRows).toHaveLength(2);
    },
    15000,
  );

  it("rolls back the entire transaction when one scanned item is already removed", async () => {
    const load = await insertLoadWithItems(["10", "20"]);
    loadIds.push(load.load.id);

    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, load.items[0].id));

    await expect(
      removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "John Doe",
        qrTokens: [load.items[0].qrToken, load.items[1].qrToken],
      }),
    ).rejects.toThrow();

    const freshItem = await db
      .select()
      .from(items)
      .where(eq(items.id, load.items[1].id));
    expect(freshItem[0].status).toBe("in_stock");

    const reloadedLoad = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.load.id));
    expect(reloadedLoad[0].itemCount).toBe(2);
    expect(reloadedLoad[0].remainingWeight).toBe("30");

    const removalRows = await db
      .select()
      .from(removals)
      .where(eq(removals.driver, "John Doe"));
    expect(removalRows).toHaveLength(0);
  });
});
