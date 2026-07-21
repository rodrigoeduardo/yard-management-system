import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getItemStatusByQrToken } from "./items";
import { resolveMaterialId } from "./materials";
import { items, loads } from "./schema";

describe("getItemStatusByQrToken", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertItem(status: "in_stock" | "removed") {
    const { id: materialId } = await resolveMaterialId(db, "Aço");
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-ITEM-STATUS-${randomUUID()}`,
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
      .values({ loadId: load.id, weight: "10", status })
      .returning();

    return item;
  }

  it("returns the status of an existing item", async () => {
    const item = await insertItem("in_stock");

    expect(await getItemStatusByQrToken(item.qrToken)).toBe("in_stock");
  });

  it("returns a removed item's status", async () => {
    const item = await insertItem("removed");

    expect(await getItemStatusByQrToken(item.qrToken)).toBe("removed");
  });

  it("returns null when no item has that qr_token", async () => {
    expect(await getItemStatusByQrToken(randomUUID())).toBeNull();
  });
});
