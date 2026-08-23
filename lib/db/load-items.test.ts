import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getLoadItems } from "./load-items";
import { resolveMaterialId } from "./materials";
import { items, loads } from "./schema";

describe("getLoadItems", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("returns each item's identifier, weight and status, oldest first", async () => {
    const notaFiscal = `NF-LOAD-ITEMS-${randomUUID()}`;
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 2,
        remainingWeight: "15",
      })
      .returning();
    createdLoadIds.push(load.id);

    const [first] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10", number: 1 })
      .returning();
    const [second] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "5", status: "removed", number: 2 })
      .returning();

    const result = await getLoadItems(load.id);

    expect(result).toEqual([
      {
        id: first.id,
        identifier: `Item 1 - ${notaFiscal}`,
        number: 1,
        weight: "10",
        status: "in_stock",
        corrida: null,
      },
      {
        id: second.id,
        identifier: `Item 2 - ${notaFiscal}`,
        number: 2,
        weight: "5",
        status: "removed",
        corrida: null,
      },
    ]);
  });

  it("carries each item's own corrida", async () => {
    const notaFiscal = `NF-LOAD-ITEMS-CORRIDA-${randomUUID()}`;
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 2,
        remainingWeight: "15",
      })
      .returning();
    createdLoadIds.push(load.id);

    const [withCorrida] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10", number: 1, corrida: "C-4471" })
      .returning();
    const [withoutCorrida] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "5", number: 2 })
      .returning();

    const result = await getLoadItems(load.id);

    expect(result).toEqual([
      {
        id: withCorrida.id,
        identifier: `Item 1 - ${notaFiscal}`,
        number: 1,
        weight: "10",
        status: "in_stock",
        corrida: "C-4471",
      },
      {
        id: withoutCorrida.id,
        identifier: `Item 2 - ${notaFiscal}`,
        number: 2,
        weight: "5",
        status: "in_stock",
        corrida: null,
      },
    ]);
  });

  it("numbers items by the persisted number, not by array position", async () => {
    const notaFiscal = `NF-LOAD-ITEMS-NUMBER-${randomUUID()}`;
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 2,
        remainingWeight: "15",
      })
      .returning();
    createdLoadIds.push(load.id);

    // Only item number 3 remains in stock — mimicking items 1 and 2 having
    // been removed and their rows rewritten to the end of the heap.
    const [remaining] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10", number: 3 })
      .returning();

    const result = await getLoadItems(load.id);

    expect(result).toEqual([
      {
        id: remaining.id,
        identifier: `Item 3 - ${notaFiscal}`,
        number: 3,
        weight: "10",
        status: "in_stock",
        corrida: null,
      },
    ]);
  });

  it("returns an empty array for a load with no items", async () => {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-LOAD-ITEMS-EMPTY-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "0",
        materialId,
        itemCount: 0,
        remainingWeight: "0",
      })
      .returning();
    createdLoadIds.push(load.id);

    const result = await getLoadItems(load.id);

    expect(result).toEqual([]);
  });

  it("returns an empty array for an unknown load id", async () => {
    const result = await getLoadItems(randomUUID());

    expect(result).toEqual([]);
  });
});
