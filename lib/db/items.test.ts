import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getItemStatusByQrToken, updateItemWeight } from "./items";
import { resolveMaterialId } from "./materials";
import { items, loads } from "./schema";

describe("getItemStatusByQrToken", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertItem(status: "in_stock" | "removed") {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-STATUS-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 1,
        remainingWeight: "10",
      })
      .returning();
    createdLoadIds.push(load.id);

    const [item] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10", status, number: 1 })
      .returning();

    return item;
  }

  it("returns the status of an existing item", async () => {
    const item = await insertItem("in_stock");

    expect(await getItemStatusByQrToken(item.qrToken)).toBe("in_stock");
  });

  it("returns a removed item's status", async () => {
    const item = await insertItem("removed");

    expect(await getItemStatusByQrToken(item.qrToken)).toBe("removed");
  });

  it("returns null when no item has that qr_token", async () => {
    expect(await getItemStatusByQrToken(randomUUID())).toBeNull();
  });
});

describe("updateItemWeight", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertLoadWithItems(itemWeights: string[]) {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-WEIGHT-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: itemWeights.length,
        remainingWeight: itemWeights.reduce(
          (total, weight) => total + Number(weight),
          0,
        ).toString(),
      })
      .returning();
    createdLoadIds.push(load.id);

    const insertedItems = await db
      .insert(items)
      .values(
        itemWeights.map((weight, index) => ({
          loadId: load.id,
          weight,
          number: index + 1,
        })),
      )
      .returning();

    return { load, items: insertedItems };
  }

  it("updates an in-stock item's weight and recomputes the remaining weight exactly", async () => {
    const { load, items: insertedItems } = await insertLoadWithItems([
      "1",
      "2",
      "3",
    ]);

    await updateItemWeight(insertedItems[1].id, "2.5");

    const [updatedLoad] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(updatedLoad.remainingWeight).toBe("6.5");
    expect(updatedLoad.itemCount).toBe(3);

    const [updatedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, insertedItems[1].id));
    expect(updatedItem.weight).toBe("2.5");
  });

  it("sums decimal weights without floating-point drift", async () => {
    const { load, items: insertedItems } = await insertLoadWithItems([
      "0.1",
      "0.2",
    ]);

    await updateItemWeight(insertedItems[0].id, "0.1");

    const [updatedLoad] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(updatedLoad.remainingWeight).toBe("0.3");
  });

  it("refuses to edit a removed item without changing its weight", async () => {
    const { items: insertedItems } = await insertLoadWithItems(["1"]);
    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, insertedItems[0].id));

    await expect(updateItemWeight(insertedItems[0].id, "2")).rejects.toThrow(
      "Item is not in stock",
    );

    const [unchangedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, insertedItems[0].id));
    expect(unchangedItem.weight).toBe("1");
  });
});
