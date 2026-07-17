import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { listRemovalNfs, listRemovalsMostRecentFirst } from "./removal-log";
import { removeScannedItems } from "./removals";
import { items, loads, removalItems, removals } from "./schema";

async function insertLoadWithItems(itemWeights: string[]) {
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-LOG-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      material: "Aço",
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

describe("removal log queries", () => {
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
    "lists removals most recently created first",
    async () => {
      const load = await insertLoadWithItems(["10", "20"]);
      loadIds.push(load.load.id);

      const older = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Driver A",
        qrTokens: [load.items[0].qrToken],
      });
      removalIds.push(older.id);

      const newer = await removeScannedItems({
        exitDate: new Date("2026-02-02"),
        driver: "Driver B",
        qrTokens: [load.items[1].qrToken],
      });
      removalIds.push(newer.id);

      const listed = await listRemovalsMostRecentFirst();
      const ids = listed.map((r) => r.id);
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    },
    15000,
  );

  it(
    "lists the NF for each removed item's originating load",
    async () => {
      const loadA = await insertLoadWithItems(["10"]);
      const loadB = await insertLoadWithItems(["5"]);
      loadIds.push(loadA.load.id, loadB.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Driver A",
        qrTokens: [loadA.items[0].qrToken, loadB.items[0].qrToken],
      });
      removalIds.push(removal.id);

      const nfRows = await listRemovalNfs();
      const nfsForRemoval = nfRows
        .filter((r) => r.removalId === removal.id)
        .map((r) => r.notaFiscal);

      expect(nfsForRemoval).toContain(loadA.load.notaFiscal);
      expect(nfsForRemoval).toContain(loadB.load.notaFiscal);
    },
    15000,
  );
});
