import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";
import { updateItemCorridaAction } from "./item-corrida";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}));

describe("updateItemCorridaAction", () => {
  const loadIds: string[] = [];
  const originalFlag = process.env.FEATURE_LOAD_EDIT;

  afterEach(async () => {
    if (originalFlag === undefined) {
      delete process.env.FEATURE_LOAD_EDIT;
    } else {
      process.env.FEATURE_LOAD_EDIT = originalFlag;
    }

    while (loadIds.length > 0) {
      const loadId = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, loadId));
      await db.delete(loads).where(eq(loads.id, loadId));
    }
  });

  async function insertLoadWithItem(
    status: "in_stock" | "removed" = "in_stock",
    corrida: string | null = "C-1",
  ) {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-CORRIDA-ACTION-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 1,
        remainingWeight: "2",
      })
      .returning();
    loadIds.push(load.id);

    const [item] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "2", status, number: 1, corrida })
      .returning();

    return { load, item };
  }

  it("is inert while FEATURE_LOAD_EDIT is unset", async () => {
    delete process.env.FEATURE_LOAD_EDIT;
    const { item } = await insertLoadWithItem();

    const result = await updateItemCorridaAction({
      itemId: item.id,
      corrida: "C-2",
    });

    expect(result).toMatchObject({ success: false });
    const [unchangedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(unchangedItem.corrida).toBe("C-1");
  });

  it.each(["", "   "])(
    "rejects blank corrida %p with a validation error and no write",
    async (corrida) => {
      process.env.FEATURE_LOAD_EDIT = "true";
      const { item } = await insertLoadWithItem();

      const result = await updateItemCorridaAction({ itemId: item.id, corrida });

      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected validation error");
      const [unchangedItem] = await db
        .select()
        .from(items)
        .where(eq(items.id, item.id));
      expect(unchangedItem.corrida).toBe("C-1");
    },
  );

  it("corrects an in-stock item's corrida when the flag is enabled, trimmed", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const { item } = await insertLoadWithItem();

    const result = await updateItemCorridaAction({
      itemId: item.id,
      corrida: "  C-2  ",
    });

    expect(result.success).toBe(true);
    const [updatedItem] = await db
      .select()
      .from(items)
      .where(eq(items.id, item.id));
    expect(updatedItem.corrida).toBe("C-2");
  });

  it("accepts a first value for an item whose corrida is NULL", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const { item } = await insertLoadWithItem("in_stock", null);

    const result = await updateItemCorridaAction({
      itemId: item.id,
      corrida: "C-NEW",
    });

    expect(result.success).toBe(true);
  });

  it("refuses a direct correction attempt for a removed item", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const { item } = await insertLoadWithItem("removed");

    const result = await updateItemCorridaAction({
      itemId: item.id,
      corrida: "C-2",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Item is not in stock",
    });
  });
});
