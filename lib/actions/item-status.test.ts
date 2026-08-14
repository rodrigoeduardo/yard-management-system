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

  it("returns the item's status for a known qr_token", async () => {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-CHECK-STATUS-${randomUUID()}`,
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

    const result = await checkItemStatus(item.qrToken);
    expect(result).toEqual({ success: true, status: "in_stock" });
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
