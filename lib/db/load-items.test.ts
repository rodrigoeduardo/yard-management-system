import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getLoadItems } from "./load-items";
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
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 2,
        remainingWeight: "15",
      })
      .returning();
    createdLoadIds.push(load.id);

    const [first] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10" })
      .returning();
    const [second] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "5", status: "removed" })
      .returning();

    const result = await getLoadItems(load.id);

    expect(result).toEqual([
      { id: first.id, identifier: `Item 1 - ${notaFiscal}`, weight: "10", status: "in_stock" },
      { id: second.id, identifier: `Item 2 - ${notaFiscal}`, weight: "5", status: "removed" },
    ]);
  });

  it("returns an empty array for a load with no items", async () => {
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-LOAD-ITEMS-EMPTY-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "0",
        material: "Aço",
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
