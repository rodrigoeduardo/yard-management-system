import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";
import { fetchLoadForEdit, fetchLoadItems } from "./load-items";

describe("fetchLoadItems", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("returns the load's items for a known load id", async () => {
    const notaFiscal = `NF-FETCH-ITEMS-${randomUUID()}`;
    const { id: materialId } = await resolveMaterialId(db, "Aço");
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
      .values({ loadId: load.id, weight: "10", number: 1 })
      .returning();

    const result = await fetchLoadItems(load.id);

    expect(result).toEqual({
      success: true,
      items: [
        {
          id: item.id,
          identifier: `Item 1 - ${notaFiscal}`,
          number: 1,
          weight: "10",
          status: "in_stock",
          corrida: null,
        },
      ],
    });
  });

  it("returns an empty list for an unknown load id", async () => {
    const result = await fetchLoadItems(randomUUID());
    expect(result).toEqual({ success: true, items: [] });
  });

  it("rejects a malformed load id", async () => {
    const result = await fetchLoadItems("not-a-uuid");
    expect(result.success).toBe(false);
  });
});

describe("fetchLoadForEdit", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("returns raw fields for a known load id", async () => {
    const notaFiscal = `NF-FETCH-EDIT-${randomUUID()}`;
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal,
        transportOrder: "OT-0001",
        driver: "João Silva",
        nfDate: "2026-01-01",
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        materialId,
        itemCount: 1,
        remainingWeight: "10",
      })
      .returning();
    createdLoadIds.push(load.id);

    const result = await fetchLoadForEdit(load.id);

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.load).toMatchObject({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      material: "Aço",
      materialId,
      removedItemCount: 0,
    });
  });

  it("returns a failure for an unknown load id", async () => {
    const result = await fetchLoadForEdit(randomUUID());
    expect(result.success).toBe(false);
  });

  it("rejects a malformed load id", async () => {
    const result = await fetchLoadForEdit("not-a-uuid");
    expect(result.success).toBe(false);
  });
});
