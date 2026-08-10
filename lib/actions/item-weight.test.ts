import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";
import { updateItemWeightAction } from "./item-weight";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}));

describe("updateItemWeightAction", () => {
  const loadIds: string[] = [];
  const originalFlag = process.env.FEATURE_ITEM_WEIGHT_EDIT;

  afterEach(async () => {
    if (originalFlag === undefined) {
      delete process.env.FEATURE_ITEM_WEIGHT_EDIT;
    } else {
      process.env.FEATURE_ITEM_WEIGHT_EDIT = originalFlag;
    }

    while (loadIds.length > 0) {
      const loadId = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, loadId));
      await db.delete(loads).where(eq(loads.id, loadId));
    }
  });

  async function insertLoadWithItem(weight = "2") {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-WEIGHT-ACTION-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 1,
        remainingWeight: sumDecimalStrings([weight]),
      })
      .returning();
    loadIds.push(load.id);

    const [item] = await db
      .insert(items)
      .values({ loadId: load.id, weight })
      .returning();

    return { load, item };
  }

  it("is inert while FEATURE_ITEM_WEIGHT_EDIT is unset", async () => {
    delete process.env.FEATURE_ITEM_WEIGHT_EDIT;
    const { item } = await insertLoadWithItem();

    const result = await updateItemWeightAction({
      itemId: item.id,
      weight: 2.5,
    });

    expect(result).toMatchObject({ success: false });
    const [unchangedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(unchangedItem.weight).toBe("2");
  });

  it.each(["abc", 0, -1])(
    "rejects invalid weight %p with a PT-BR error and no write",
    async (weight) => {
      process.env.FEATURE_ITEM_WEIGHT_EDIT = "true";
      const { item } = await insertLoadWithItem();

      const result = await updateItemWeightAction({
        itemId: item.id,
        weight: weight as number,
      });

      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected validation error");
      expect(JSON.stringify(result.error)).toMatch(/peso|maior/i);
      const [unchangedItem] = await db
        .select()
        .from(items)
        .where(eq(items.id, item.id));
      expect(unchangedItem.weight).toBe("2");
    },
  );

  it("corrects an in-stock item when the flag is enabled", async () => {
    process.env.FEATURE_ITEM_WEIGHT_EDIT = "true";
    const { load, item } = await insertLoadWithItem();

    const result = await updateItemWeightAction({ itemId: item.id, weight: 2.5 });

    expect(result.success).toBe(true);
    const [updatedLoad] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(updatedLoad.remainingWeight).toBe("2.5");
  });

  it("refuses a direct correction attempt for a removed item", async () => {
    process.env.FEATURE_ITEM_WEIGHT_EDIT = "true";
    const { item } = await insertLoadWithItem();
    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, item.id));

    const result = await updateItemWeightAction({ itemId: item.id, weight: 2.5 });

    expect(result).toMatchObject({ success: false, error: "Item is not in stock" });
  });
});
