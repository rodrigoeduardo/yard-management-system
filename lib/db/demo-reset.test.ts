import { randomUUID } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  DEMO_LOADS,
  DEMO_REMOVALS,
  FINISHED_LOAD_NOTA_FISCAL,
  MULTI_LOAD_REMOVAL_DRIVER,
} from "@/scripts/lib/demo-dataset";
import { withAuditUser } from "./audit-context";
import { resetDemoData } from "./demo-reset";
import { db } from "./index";
import {
  auditLog,
  items,
  loads,
  materials,
  removalItems,
  removals,
} from "./schema";

/**
 * Integration coverage for the nightly demo reset (ADR 0003). Populates the
 * demo tables with unrelated "junk" data (simulating a day of demo traffic),
 * runs the `reset_demo_data()` Postgres function via `resetDemoData()`, and
 * asserts the tables end up containing exactly the fixed seed dataset from
 * `scripts/lib/demo-dataset.ts` (#248) — nothing from the junk data survives.
 */
async function insertJunkData(): Promise<void> {
  const junkMaterial = await withAuditUser(null, async (tx) => {
    const [material] = await tx
      .insert(materials)
      .values({ name: `Junk-${randomUUID()}` })
      .returning();
    return material;
  });

  const junkLoad = await withAuditUser(null, async (tx) => {
    const [load] = await tx
      .insert(loads)
      .values({
        notaFiscal: `JUNK-${randomUUID()}`,
        entryDate: new Date(),
        nfWeight: "10.00",
        materialId: junkMaterial.id,
        itemCount: 2,
        remainingWeight: "10.00",
      })
      .returning();

    await tx.insert(items).values([
      { loadId: load.id, weight: "5.00" },
      { loadId: load.id, weight: "5.00" },
    ]);

    return load;
  });

  const junkItems = await withAuditUser(null, async (tx) =>
    tx.select().from(items).where(eq(items.loadId, junkLoad.id)),
  );

  await withAuditUser(null, async (tx) => {
    const [removal] = await tx
      .insert(removals)
      .values({
        exitDate: new Date(),
        driver: `Junk driver ${randomUUID()}`,
        vehiclePlate: "JUNK123",
        pedidoImagePath: "removal-pedidos/test.jpg",
        totalRemovedWeight: "5.00",
      })
      .returning();

    await tx.insert(removalItems).values({
      removalId: removal.id,
      itemId: junkItems[0].id,
    });

    await tx
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, junkItems[0].id));
  });
}

describe("resetDemoData", () => {
  it(
    "truncates junk data and reseeds exactly the fixed demo dataset, inside one transaction",
    async () => {
      await insertJunkData();

      const junkAuditRowsBefore = await countAuditLogRows();
      expect(junkAuditRowsBefore).toBeGreaterThan(0);

      await resetDemoData();

      // Materials: exactly the demo materials, nothing junk survives.
      const materialRows = await db.select().from(materials);
      const materialNames = new Set(materialRows.map((m) => m.name));
      const expectedMaterialNames = new Set(
        DEMO_LOADS.map((load) => load.material),
      );
      expect(materialNames).toEqual(expectedMaterialNames);

      // Loads: exactly the demo loads (by Nota Fiscal), nothing junk survives.
      const loadRows = await db
        .select()
        .from(loads)
        .orderBy(asc(loads.notaFiscal));
      expect(new Set(loadRows.map((l) => l.notaFiscal))).toEqual(
        new Set(DEMO_LOADS.map((l) => l.notaFiscal)),
      );

      // item_count reflects items still in stock, i.e. total seeded minus
      // whatever the demo removals took from that load.
      const removedCountByNotaFiscal = new Map<string, number>();
      for (const removal of DEMO_REMOVALS) {
        for (const target of removal.targets) {
          removedCountByNotaFiscal.set(
            target.notaFiscal,
            (removedCountByNotaFiscal.get(target.notaFiscal) ?? 0) +
              target.count,
          );
        }
      }

      for (const spec of DEMO_LOADS) {
        const load = loadRows.find((l) => l.notaFiscal === spec.notaFiscal);
        expect(load).toBeDefined();

        // Every item ever seeded for this load still exists as a row
        // (removal only flips `status`, never deletes).
        const loadItems = await db
          .select()
          .from(items)
          .where(eq(items.loadId, load!.id));
        expect(loadItems).toHaveLength(spec.itemWeights.length);

        const removedCount = removedCountByNotaFiscal.get(spec.notaFiscal) ?? 0;
        expect(load!.itemCount).toBe(spec.itemWeights.length - removedCount);
      }

      // The finished load ends with item_count = 0, remaining_weight = 0.
      const [finishedLoad] = await db
        .select()
        .from(loads)
        .where(eq(loads.notaFiscal, FINISHED_LOAD_NOTA_FISCAL));
      expect(finishedLoad).toBeDefined();
      expect(finishedLoad.itemCount).toBe(0);
      expect(Number(finishedLoad.remainingWeight)).toBe(0);

      // Removals: exactly the demo removals (by driver), nothing junk survives.
      const removalRows = await db.select().from(removals);
      expect(new Set(removalRows.map((r) => r.driver))).toEqual(
        new Set(DEMO_REMOVALS.map((r) => r.driver)),
      );

      // The multi-load removal really spans items from more than one load.
      const [multiLoadRemoval] = await db
        .select()
        .from(removals)
        .where(eq(removals.driver, MULTI_LOAD_REMOVAL_DRIVER));
      expect(multiLoadRemoval).toBeDefined();
      const removedItemLoads = await db
        .select({ loadId: items.loadId })
        .from(removalItems)
        .innerJoin(items, eq(removalItems.itemId, items.id))
        .where(eq(removalItems.removalId, multiLoadRemoval.id));
      expect(new Set(removedItemLoads.map((row) => row.loadId)).size).toBe(2);

      // audit_log reflects only post-reset activity: none of the junk rows
      // survived the truncate (audit_log was truncated too), but the
      // reseed's normal inserts/updates on loads/items/removals produced
      // fresh, non-empty audit trail for the demo dataset.
      const auditRows = await db.select().from(auditLog);
      expect(auditRows.length).toBeGreaterThan(0);

      // Every audited record id belongs to a row that exists in the reseeded
      // dataset (i.e. nothing junk left an audit trail behind).
      const currentLoadIds = new Set(loadRows.map((l) => l.id));
      const auditedLoadInsertIds = new Set(
        auditRows
          .filter((row) => row.tableName === "loads" && row.action === "INSERT")
          .map((row) => row.recordId),
      );
      expect(auditedLoadInsertIds).toEqual(currentLoadIds);

      const auditedRemovalIds = new Set(
        auditRows
          .filter((row) => row.tableName === "removals" && row.action === "INSERT")
          .map((row) => row.recordId),
      );
      expect(auditedRemovalIds).toEqual(new Set(removalRows.map((r) => r.id)));
    },
    30000,
  );
});

async function countAuditLogRows(): Promise<number> {
  const [row] = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from audit_log`,
  );
  return row?.count ?? 0;
}
