import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";
import { checkItemStatus } from "./item-status";

describe("checkItemStatus", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertItem(weight: string) {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const notaFiscal = `NF-CHECK-STATUS-${randomUUID()}`;
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
      .values({ loadId: load.id, weight, number: 1, corrida: "C-4471" })
      .returning();

    return { item, notaFiscal };
  }

  it("returns the item's status and current data for a known qr_token", async () => {
    const { item, notaFiscal } = await insertItem("10");

    const result = await checkItemStatus(item.qrToken);

    expect(result).toEqual({
      success: true,
      status: "in_stock",
      item: {
        qrToken: item.qrToken,
        number: 1,
        notaFiscal,
        material: "Aço",
        weight: "10",
        corrida: "C-4471",
      },
    });
  });

  it("returns the weight recorded now, not the one printed on the scanned label", async () => {
    const { item } = await insertItem("10");
    await db.update(items).set({ weight: "12" }).where(eq(items.id, item.id));

    const result = await checkItemStatus(item.qrToken);

    expect(result.success && result.status !== "not_found" && result.item.weight).toBe("12");
  });

  it("returns not_found for an unknown qr_token", async () => {
    const result = await checkItemStatus(randomUUID());
    expect(result).toEqual({ success: true, status: "not_found" });
  });

  it("rejects a malformed qr_token", async () => {
    const result = await checkItemStatus("not-a-uuid");
    expect(result.success).toBe(false);
  });
});
