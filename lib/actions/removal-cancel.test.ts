import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { resolveMaterialId } from "@/lib/db/materials";
import { removeScannedItems } from "@/lib/db/removals";
import { items, loads, removalItems, removals } from "@/lib/db/schema";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}));

let cancelRemovalAction: typeof import("./removal-cancel").cancelRemovalAction;
beforeAll(async () => {
  ({ cancelRemovalAction } = await import("./removal-cancel"));
});

async function insertLoadWithItems(itemWeights: string[]) {
  const { id: materialId } = await resolveMaterialId(db, "Aço");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-CANCEL-ACTION-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      materialId,
      itemCount: itemWeights.length,
      remainingWeight: sumDecimalStrings(itemWeights),
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(itemWeights.map((weight) => ({ loadId: load.id, weight })))
    .returning();

  return { load, items: insertedItems };
}

describe("cancelRemovalAction", () => {
  const loadIds: string[] = [];
  const removalIds: string[] = [];
  const originalFlag = process.env.FEATURE_REMOVAL_CANCEL;

  afterEach(async () => {
    if (originalFlag === undefined) {
      delete process.env.FEATURE_REMOVAL_CANCEL;
    } else {
      process.env.FEATURE_REMOVAL_CANCEL = originalFlag;
    }

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

  it("rejects when FEATURE_REMOVAL_CANCEL is not set, without touching the database", async () => {
    delete process.env.FEATURE_REMOVAL_CANCEL;
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Flag Off Driver",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "removal-pedidos/flag-off.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    const result = await cancelRemovalAction(removal.id);

    expect(result.success).toBe(false);

    const reloadedLoad = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.load.id));
    expect(reloadedLoad[0].itemCount).toBe(0);
  });

  it(
    "cancels the removal and restores the load when the flag is on",
    async () => {
      process.env.FEATURE_REMOVAL_CANCEL = "true";
      const load = await insertLoadWithItems(["10"]);
      loadIds.push(load.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Flag On Driver",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/flag-on.jpg",
        qrTokens: [load.items[0].qrToken],
      });
      removalIds.push(removal.id);

      const result = await cancelRemovalAction(removal.id);

      expect(result.success).toBe(true);

      const reloadedLoad = await db
        .select()
        .from(loads)
        .where(eq(loads.id, load.load.id));
      expect(reloadedLoad[0].itemCount).toBe(1);
      expect(reloadedLoad[0].remainingWeight).toBe("10");
    },
    20000,
  );

  it("rejects an invalid removal id", async () => {
    process.env.FEATURE_REMOVAL_CANCEL = "true";
    const result = await cancelRemovalAction("not-a-uuid");
    expect(result.success).toBe(false);
  });
});
