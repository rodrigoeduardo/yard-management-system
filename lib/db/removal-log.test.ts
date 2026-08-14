import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import {
  listRemovalNfs,
  listRemovalsMostRecentFirst,
  listRemovalsPage,
} from "./removal-log";
import { removeScannedItems } from "./removals";
import { items, loads, removalItems, removals } from "./schema";

async function insertLoadWithItems(itemWeights: string[]) {
  const { id: materialId } = await resolveMaterialId(db, "Aço");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-LOG-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      materialId,
      itemCount: itemWeights.length,
      remainingWeight: sumDecimalStrings(itemWeights),
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(
      itemWeights.map((weight, index) => ({
        loadId: load.id,
        weight,
        number: index + 1,
      })),
    )
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
        vehiclePlate: "AAA1111",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });
      removalIds.push(older.id);

      const newer = await removeScannedItems({
        exitDate: new Date("2026-02-02"),
        driver: "Driver B",
        vehiclePlate: "BBB2222",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[1].qrToken],
      });
      removalIds.push(newer.id);

      const listed = await listRemovalsMostRecentFirst();
      const ids = listed.map((r) => r.id);
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    },
    20000,
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
        vehiclePlate: "AAA1111",
        pedidoImagePath: "removal-pedidos/test.jpg",
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
    20000,
  );

  it(
    "filters listRemovalNfs to only the given removal ids",
    async () => {
      const loadA = await insertLoadWithItems(["10"]);
      const loadB = await insertLoadWithItems(["5"]);
      loadIds.push(loadA.load.id, loadB.load.id);

      const removalA = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Driver A",
        vehiclePlate: "AAA1111",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [loadA.items[0].qrToken],
      });
      const removalB = await removeScannedItems({
        exitDate: new Date("2026-02-02"),
        driver: "Driver B",
        vehiclePlate: "BBB2222",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [loadB.items[0].qrToken],
      });
      removalIds.push(removalA.id, removalB.id);

      const nfRows = await listRemovalNfs([removalA.id]);
      expect(nfRows.map((r) => r.removalId)).toEqual([removalA.id]);
    },
    20000,
  );

  describe("listRemovalsPage", () => {
    it("exposes cancelledAt so the Histórico can mark a cancelled removal (issue #310)", async () => {
      const load = await insertLoadWithItems(["10"]);
      loadIds.push(load.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: `Cancelled Log Driver ${randomUUID()}`,
        vehiclePlate: "AAA1111",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });
      removalIds.push(removal.id);

      await db
        .update(removals)
        .set({ cancelledAt: new Date("2026-02-02") })
        .where(eq(removals.id, removal.id));

      const result = await listRemovalsPage({
        q: removal.driver,
        order: "exitDate",
        dir: "desc",
        page: 1,
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].cancelledAt).toBeInstanceOf(Date);
    });

    it(
      "matches the search term against the driver or an NF of a removed item, case-insensitively",
      async () => {
        const marker = randomUUID();
        const loadDriver = await insertLoadWithItems(["10"]);
        const loadNf = await insertLoadWithItems(["5"]);
        loadIds.push(loadDriver.load.id, loadNf.load.id);

        const byDriver = await removeScannedItems({
          exitDate: new Date("2026-02-01"),
          driver: `Motorista-${marker}`,
          vehiclePlate: "AAA1111",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadDriver.items[0].qrToken],
        });
        const byNf = await removeScannedItems({
          exitDate: new Date("2026-02-02"),
          driver: "Outro Motorista",
          vehiclePlate: "BBB2222",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadNf.items[0].qrToken],
        });
        removalIds.push(byDriver.id, byNf.id);

        const driverResult = await listRemovalsPage({
          q: `motorista-${marker}`.toUpperCase(),
          order: "exitDate",
          dir: "desc",
          page: 1,
        });
        expect(driverResult.rows.map((r) => r.id)).toEqual([byDriver.id]);
        expect(driverResult.total).toBe(1);

        const nfResult = await listRemovalsPage({
          q: loadNf.load.notaFiscal.toLowerCase(),
          order: "exitDate",
          dir: "desc",
          page: 1,
        });
        expect(nfResult.rows.map((r) => r.id)).toEqual([byNf.id]);
        expect(nfResult.total).toBe(1);
      },
      20000,
    );

    it(
      "orders by the requested column and direction, including the computed item count",
      async () => {
        const marker = randomUUID();
        const loadA = await insertLoadWithItems(["10", "20"]);
        const loadB = await insertLoadWithItems(["100"]);
        loadIds.push(loadA.load.id, loadB.load.id);

        const light = await removeScannedItems({
          exitDate: new Date("2026-03-01"),
          driver: `Driver-Order-${marker}-LIGHT`,
          vehiclePlate: "AAA1111",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadA.items[0].qrToken],
        });
        const heavy = await removeScannedItems({
          exitDate: new Date("2026-03-02"),
          driver: `Driver-Order-${marker}-HEAVY`,
          vehiclePlate: "BBB2222",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadA.items[1].qrToken, loadB.items[0].qrToken],
        });
        removalIds.push(light.id, heavy.id);

        const asc = await listRemovalsPage({
          q: `Driver-Order-${marker}`,
          order: "itemCount",
          dir: "asc",
          page: 1,
        });
        expect(asc.rows.map((r) => r.id)).toEqual([light.id, heavy.id]);
        expect(asc.rows.find((r) => r.id === light.id)?.itemCount).toBe(1);
        expect(asc.rows.find((r) => r.id === heavy.id)?.itemCount).toBe(2);

        const desc = await listRemovalsPage({
          q: `Driver-Order-${marker}`,
          order: "itemCount",
          dir: "desc",
          page: 1,
        });
        expect(desc.rows.map((r) => r.id)).toEqual([heavy.id, light.id]);
      },
      20000,
    );

    it(
      "paginates with SQL limit/offset and reports the total matching row count",
      async () => {
        const marker = randomUUID();
        for (let i = 0; i < 3; i += 1) {
          const load = await insertLoadWithItems(["10"]);
          loadIds.push(load.load.id);
          const removal = await removeScannedItems({
            exitDate: new Date(2026, 3, i + 1),
            driver: `Driver-Page-${marker}`,
            vehiclePlate: "AAA1111",
            pedidoImagePath: "removal-pedidos/test.jpg",
            qrTokens: [load.items[0].qrToken],
          });
          removalIds.push(removal.id);
        }

        const pageOne = await listRemovalsPage({
          q: `Driver-Page-${marker}`,
          order: "exitDate",
          dir: "asc",
          page: 1,
          pageSize: 2,
        });
        expect(pageOne.rows).toHaveLength(2);
        expect(pageOne.total).toBe(3);

        const pageTwo = await listRemovalsPage({
          q: `Driver-Page-${marker}`,
          order: "exitDate",
          dir: "asc",
          page: 2,
          pageSize: 2,
        });
        expect(pageTwo.rows).toHaveLength(1);
        expect(pageTwo.total).toBe(3);
      },
      20000,
    );

    it(
      "includes the vehicle plate in each row",
      async () => {
        const marker = randomUUID();
        const load = await insertLoadWithItems(["10"]);
        loadIds.push(load.load.id);

        const removal = await removeScannedItems({
          exitDate: new Date("2026-02-01"),
          driver: `Driver-Plate-${marker}`,
          vehiclePlate: "ABC1234",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [load.items[0].qrToken],
        });
        removalIds.push(removal.id);

        const result = await listRemovalsPage({
          q: `Driver-Plate-${marker}`,
          order: "exitDate",
          dir: "desc",
          page: 1,
        });

        expect(result.rows[0]?.vehiclePlate).toBe("ABC1234");
      },
      20000,
    );

    it(
      "returns an empty page (no error) when no row matches the search",
      async () => {
        const result = await listRemovalsPage({
          q: `no-such-driver-${randomUUID()}`,
          order: "exitDate",
          dir: "desc",
          page: 1,
        });
        expect(result.rows).toEqual([]);
        expect(result.total).toBe(0);
      },
      20000,
    );

    it(
      "combines the exit date range and total removed weight range filters with search and ordering",
      async () => {
        const marker = randomUUID();
        const loadEarlyLight = await insertLoadWithItems(["10"]);
        const loadMidHeavy = await insertLoadWithItems(["500"]);
        const loadLateLight = await insertLoadWithItems(["20"]);
        loadIds.push(
          loadEarlyLight.load.id,
          loadMidHeavy.load.id,
          loadLateLight.load.id,
        );

        const early = await removeScannedItems({
          exitDate: new Date("2026-04-01T12:00:00Z"),
          driver: `Driver-Filter-${marker}`,
          vehiclePlate: "AAA1111",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadEarlyLight.items[0].qrToken],
        });
        const mid = await removeScannedItems({
          exitDate: new Date("2026-04-15T12:00:00Z"),
          driver: `Driver-Filter-${marker}`,
          vehiclePlate: "BBB2222",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadMidHeavy.items[0].qrToken],
        });
        const late = await removeScannedItems({
          exitDate: new Date("2026-04-30T12:00:00Z"),
          driver: `Driver-Filter-${marker}`,
          vehiclePlate: "CCC3333",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadLateLight.items[0].qrToken],
        });
        removalIds.push(early.id, mid.id, late.id);

        const result = await listRemovalsPage({
          q: `Driver-Filter-${marker}`,
          order: "exitDate",
          dir: "asc",
          page: 1,
          dateFrom: "2026-04-05",
          dateTo: "2026-04-20",
        });
        expect(result.rows.map((r) => r.id)).toEqual([mid.id]);

        const weightResult = await listRemovalsPage({
          q: `Driver-Filter-${marker}`,
          order: "exitDate",
          dir: "asc",
          page: 1,
          weightMin: "100",
        });
        expect(weightResult.rows.map((r) => r.id)).toEqual([mid.id]);
      },
      20000,
    );
  });
});
