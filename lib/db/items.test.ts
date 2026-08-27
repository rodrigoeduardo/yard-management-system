import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import {
  getItemScanSnapshotByQrToken,
  updateItemCorrida,
  updateItemWeight,
} from "./items";
import { resolveMaterialId } from "./materials";
import { items, loads } from "./schema";

describe("getItemScanSnapshotByQrToken", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertItem(
    status: "in_stock" | "removed",
    overrides: { weight?: string; corrida?: string | null } = {},
  ) {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const notaFiscal = `NF-ITEM-STATUS-${randomUUID()}`;
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
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
      .values({
        loadId: load.id,
        weight: overrides.weight ?? "10",
        corrida: overrides.corrida ?? null,
        status,
        number: 1,
      })
      .returning();

    return { item, notaFiscal };
  }

  it("returns an in-stock item's current data, labeled with its number and originating NF", async () => {
    const { item, notaFiscal } = await insertItem("in_stock", {
      weight: "10.5",
      corrida: "C-4471",
    });

    expect(await getItemScanSnapshotByQrToken(item.qrToken)).toEqual({
      qrToken: item.qrToken,
      status: "in_stock",
      number: 1,
      notaFiscal,
      material: "Aço",
      weight: "10.5",
      corrida: "C-4471",
    });
  });

  it("returns a removed item's status", async () => {
    const { item } = await insertItem("removed");

    expect((await getItemScanSnapshotByQrToken(item.qrToken))?.status).toBe(
      "removed",
    );
  });

  it("returns the weight recorded now, not the one printed on the item's label", async () => {
    const { item } = await insertItem("in_stock", { weight: "10" });
    await db.update(items).set({ weight: "12" }).where(eq(items.id, item.id));

    expect((await getItemScanSnapshotByQrToken(item.qrToken))?.weight).toBe(
      "12",
    );
  });

  it("returns a null corrida for an item that has none", async () => {
    const { item } = await insertItem("in_stock", { corrida: null });

    expect((await getItemScanSnapshotByQrToken(item.qrToken))?.corrida).toBeNull();
  });

  it("returns null when no item has that qr_token", async () => {
    expect(await getItemScanSnapshotByQrToken(randomUUID())).toBeNull();
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

describe("updateItemCorrida", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertLoadWithItem(
    status: "in_stock" | "removed",
    corrida: string | null = "C-1",
  ) {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-CORRIDA-${randomUUID()}`,
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
      .values({ loadId: load.id, weight: "10", status, number: 1, corrida })
      .returning();

    return { load, item };
  }

  it("updates an in-stock item's corrida without touching weight, status, itemCount or remainingWeight", async () => {
    const { load, item } = await insertLoadWithItem("in_stock", "C-1");

    const updated = await updateItemCorrida(item.id, "C-2");
    expect(updated.corrida).toBe("C-2");

    const [updatedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(updatedItem.corrida).toBe("C-2");
    expect(updatedItem.weight).toBe("10");
    expect(updatedItem.status).toBe("in_stock");
    expect(updatedItem.number).toBe(1);
    expect(updatedItem.qrToken).toBe(item.qrToken);

    const [unchangedLoad] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(unchangedLoad.itemCount).toBe(1);
    expect(unchangedLoad.remainingWeight).toBe("10");
  });

  it("accepts a first value for an item whose corrida is NULL", async () => {
    const { item } = await insertLoadWithItem("in_stock", null);

    await updateItemCorrida(item.id, "C-NEW");

    const [updatedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(updatedItem.corrida).toBe("C-NEW");
  });

  it("refuses to edit a removed item without changing its corrida", async () => {
    const { item } = await insertLoadWithItem("removed", "C-1");

    await expect(updateItemCorrida(item.id, "C-2")).rejects.toThrow(
      "Item is not in stock",
    );

    const [unchangedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(unchangedItem.corrida).toBe("C-1");
  });

  it("throws when the item does not exist", async () => {
    await expect(updateItemCorrida(randomUUID(), "C-2")).rejects.toThrow(
      "Item not found",
    );
  });
});
