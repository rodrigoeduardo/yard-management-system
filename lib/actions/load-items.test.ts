import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";
import { fetchLoadItems } from "./load-items";

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
          weight: "10",
          status: "in_stock",
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
