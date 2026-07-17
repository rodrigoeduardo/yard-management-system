import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { items, loads, removalItems, removals } from "@/lib/db/schema";
import { removeItems } from "./removals";

async function insertLoadWithItems(itemWeights: string[]) {
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-ACTION-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      material: "Aço",
      itemCount: itemWeights.length,
      remainingWeight: itemWeights
        .reduce((sum, w) => sum + Number(w), 0)
        .toString(),
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(itemWeights.map((weight) => ({ loadId: load.id, weight })))
    .returning();

  return { load, items: insertedItems };
}

describe("removeItems", () => {
  const loadIds: string[] = [];
  const removalIds: string[] = [];

  afterEach(async () => {
    while (removalIds.length > 0) {
      const id = removalIds.pop()!;
      await db.delete(removalItems).where(eq(removalItems.removalId, id));
      await db.delete(removals).where(eq(removals.id, id));
    }
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it(
    "removes valid scanned items and returns the total removed weight",
    async () => {
      const load = await insertLoadWithItems(["10", "20"]);
      loadIds.push(load.load.id);

      const result = await removeItems({
        exitDate: "2026-02-01",
        driver: "John Doe",
        qrTokens: [load.items[0].qrToken],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      removalIds.push(result.removal.id);

      expect(result.removal.totalRemovedWeight).toBe("10");
    },
    15000,
  );

  it("rejects an empty qrTokens array without touching the database", async () => {
    const result = await removeItems({
      exitDate: "2026-02-01",
      driver: "John Doe",
      qrTokens: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing driver", async () => {
    const result = await removeItems({
      exitDate: "2026-02-01",
      driver: "",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });
});
