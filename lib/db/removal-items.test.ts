import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getRemovalItems } from "./removal-items";
import { items, loads, removalItems, removals } from "./schema";

async function insertLoadWithItems(itemWeights: string[]) {
  const notaFiscal = `NF-REMOVAL-ITEMS-${randomUUID()}`;
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      material: "Aço",
      itemCount: itemWeights.length,
      remainingWeight: "0",
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(itemWeights.map((weight) => ({ loadId: load.id, weight })))
    .returning();

  return { load, items: insertedItems, notaFiscal };
}

async function insertRemoval(itemIds: string[]) {
  const [removal] = await db
    .insert(removals)
    .values({
      exitDate: new Date("2026-02-01"),
      driver: "Driver A",
      totalRemovedWeight: "0",
    })
    .returning();

  if (itemIds.length > 0) {
    await db
      .insert(removalItems)
      .values(itemIds.map((itemId) => ({ removalId: removal.id, itemId })));
  }

  return removal;
}

describe("getRemovalItems", () => {
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

  it("returns each removed item's identifier, weight and originating NF, from a single load", async () => {
    const load = await insertLoadWithItems(["10", "20"]);
    loadIds.push(load.load.id);

    const removal = await insertRemoval(load.items.map((item) => item.id));
    removalIds.push(removal.id);

    const result = await getRemovalItems(removal.id);

    expect(result).toEqual([
      {
        id: load.items[0].id,
        identifier: `Item 1 - ${load.notaFiscal}`,
        weight: "10",
        notaFiscal: load.notaFiscal,
      },
      {
        id: load.items[1].id,
        identifier: `Item 2 - ${load.notaFiscal}`,
        weight: "20",
        notaFiscal: load.notaFiscal,
      },
    ]);
  });

  it("labels items removed together from multiple loads with each item's own NF", async () => {
    const loadA = await insertLoadWithItems(["10"]);
    const loadB = await insertLoadWithItems(["5"]);
    loadIds.push(loadA.load.id, loadB.load.id);

    const removal = await insertRemoval([loadA.items[0].id, loadB.items[0].id]);
    removalIds.push(removal.id);

    const result = await getRemovalItems(removal.id);

    expect(result).toContainEqual({
      id: loadA.items[0].id,
      identifier: `Item 1 - ${loadA.notaFiscal}`,
      weight: "10",
      notaFiscal: loadA.notaFiscal,
    });
    expect(result).toContainEqual({
      id: loadB.items[0].id,
      identifier: `Item 1 - ${loadB.notaFiscal}`,
      weight: "5",
      notaFiscal: loadB.notaFiscal,
    });
  });

  it("indexes an item by its position among all of its load's items, not just the removed ones", async () => {
    const load = await insertLoadWithItems(["10", "20", "30"]);
    loadIds.push(load.load.id);

    // Only the second item of the load is removed.
    const removal = await insertRemoval([load.items[1].id]);
    removalIds.push(removal.id);

    const result = await getRemovalItems(removal.id);

    expect(result).toEqual([
      {
        id: load.items[1].id,
        identifier: `Item 2 - ${load.notaFiscal}`,
        weight: "20",
        notaFiscal: load.notaFiscal,
      },
    ]);
  });

  it("returns an empty array for a removal with no items", async () => {
    const removal = await insertRemoval([]);
    removalIds.push(removal.id);

    const result = await getRemovalItems(removal.id);

    expect(result).toEqual([]);
  });

  it("returns an empty array for an unknown removal id", async () => {
    const result = await getRemovalItems(randomUUID());

    expect(result).toEqual([]);
  });
});
