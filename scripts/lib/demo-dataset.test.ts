import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { auditLog, items, loads, removalItems, removals } from "@/lib/db/schema";
import {
  DEMO_LOADS,
  DEMO_REMOVALS,
  FINISHED_LOAD_NOTA_FISCAL,
  MULTI_LOAD_REMOVAL_DRIVER,
  seedDemoDataset,
} from "./demo-dataset";

describe("seedDemoDataset", () => {
  it(
    "creates the realistic demo dataset and is idempotent across two runs",
    async () => {
      const first = await seedDemoDataset();
      expect(first.loadsCreated + first.loadsSkipped).toBe(DEMO_LOADS.length);
      expect(first.removalsCreated + first.removalsSkipped).toBe(
        DEMO_REMOVALS.length,
      );

      const second = await seedDemoDataset();
      expect(second).toEqual({
        loadsCreated: 0,
        loadsSkipped: DEMO_LOADS.length,
        removalsCreated: 0,
        removalsSkipped: DEMO_REMOVALS.length,
      });

      // Several distinct materials.
      const materialNames = new Set(DEMO_LOADS.map((spec) => spec.material));
      expect(materialNames.size).toBeGreaterThanOrEqual(4);

      // Open loads carry the typical 15-18 items, varying weights.
      for (const spec of DEMO_LOADS) {
        expect(spec.itemWeights.length).toBeGreaterThanOrEqual(15);
        expect(spec.itemWeights.length).toBeLessThanOrEqual(18);
        expect(new Set(spec.itemWeights).size).toBeGreaterThan(1);

        const [load] = await db
          .select()
          .from(loads)
          .where(eq(loads.notaFiscal, spec.notaFiscal));
        expect(load).toBeDefined();
      }

      // At least one finished load: item_count = 0, remaining_weight = 0.
      const [finishedLoad] = await db
        .select()
        .from(loads)
        .where(eq(loads.notaFiscal, FINISHED_LOAD_NOTA_FISCAL));
      expect(finishedLoad.itemCount).toBe(0);
      expect(Number(finishedLoad.remainingWeight)).toBe(0);

      // A removal spans items from multiple loads (the multi-load
      // removal invariant from business-rules.md).
      const multiLoadSpec = DEMO_REMOVALS.find(
        (spec) => spec.driver === MULTI_LOAD_REMOVAL_DRIVER,
      );
      expect(multiLoadSpec?.targets.length).toBeGreaterThan(1);

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
      const distinctLoadIds = new Set(removedItemLoads.map((row) => row.loadId));
      expect(distinctLoadIds.size).toBeGreaterThan(1);

      // Seeding used normal inserts, so fresh audit_log rows exist for the
      // loads table (the audit feature stays demonstrable after a reset).
      const [seedLoad] = await db
        .select()
        .from(loads)
        .where(eq(loads.notaFiscal, DEMO_LOADS[0].notaFiscal));
      const auditRows = await db
        .select()
        .from(auditLog)
        .where(
          and(
            eq(auditLog.tableName, "loads"),
            eq(auditLog.recordId, seedLoad.id),
          ),
        );
      expect(auditRows.length).toBeGreaterThan(0);
    },
    30000,
  );
});
