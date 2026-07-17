import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { insertLoadWithItems } from "./loads";
import { items, loads } from "./schema";

describe("insertLoadWithItems", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("creates one load row and one item row per weight, with item_count and remaining_weight derived from the items", async () => {
    const notaFiscal = `NF-CREATE-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10", "20", "30"],
    });
    createdLoadIds.push(load.id);

    expect(load.itemCount).toBe(3);
    expect(load.remainingWeight).toBe("60");

    const itemRows = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id));
    expect(itemRows).toHaveLength(3);
    expect(itemRows.map((i) => i.weight).sort()).toEqual(["10", "20", "30"]);
    expect(itemRows.every((i) => i.status === "in_stock")).toBe(true);
  });

  it("derives remaining_weight from fractional weights without floating-point drift", async () => {
    const notaFiscal = `NF-FRACTIONAL-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10.1", "20.2"],
    });
    createdLoadIds.push(load.id);

    expect(load.remainingWeight).toBe("30.3");
  });

  it("rolls back the load and all items when one item insert fails mid-transaction", async () => {
    const notaFiscal = `NF-ROLLBACK-${randomUUID()}`;

    await expect(
      insertLoadWithItems({
        notaFiscal,
        entryDate: new Date("2026-01-01"),
        nfWeight: "500",
        material: "Aço",
        itemWeights: ["10", null as unknown as string],
      }),
    ).rejects.toThrow();

    const loadRows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(loadRows).toHaveLength(0);
  });
});
