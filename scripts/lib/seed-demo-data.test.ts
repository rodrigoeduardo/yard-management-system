import { randomUUID } from "node:crypto";
import { ilike } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { loads, removals } from "@/lib/db/schema";
import {
  buildSeedDriver,
  buildSeedNotaFiscal,
  cleanDemoData,
  generateItemWeights,
  seedDemoData,
  seedItemCount,
} from "./seed-demo-data";

describe("buildSeedNotaFiscal", () => {
  it("prefixes and zero-pads the load index", () => {
    expect(buildSeedNotaFiscal("SEED-", 1)).toBe("SEED-LOAD-0001");
    expect(buildSeedNotaFiscal("SEED-", 25)).toBe("SEED-LOAD-0025");
  });
});

describe("buildSeedDriver", () => {
  it("prefixes and zero-pads the removal index", () => {
    expect(buildSeedDriver("SEED-", 1)).toBe("SEED-DRIVER-0001");
  });
});

describe("seedItemCount", () => {
  it("stays within the 15-18 typical range from business rules", () => {
    for (let i = 1; i <= 40; i += 1) {
      const count = seedItemCount(i);
      expect(count).toBeGreaterThanOrEqual(15);
      expect(count).toBeLessThanOrEqual(18);
    }
  });
});

describe("generateItemWeights", () => {
  it("generates one positive decimal string per item, deterministically", () => {
    const weights = generateItemWeights(3, 5);
    expect(weights).toHaveLength(5);
    for (const w of weights) {
      expect(Number(w)).toBeGreaterThan(0);
    }
    expect(generateItemWeights(3, 5)).toEqual(weights);
  });
});

describe("seedDemoData", () => {
  const prefixes: string[] = [];

  afterEach(async () => {
    while (prefixes.length > 0) {
      await cleanDemoData(prefixes.pop()!);
    }
  });

  it(
    "creates the requested number of loads and removals respecting business rules",
    async () => {
      const prefix = `SEEDTEST-${randomUUID().slice(0, 8)}-`;
      prefixes.push(prefix);

      const summary = await seedDemoData({
        loadCount: 3,
        removalCount: 3,
        prefix,
      });

      expect(summary).toEqual({
        loadsCreated: 3,
        loadsSkipped: 0,
        removalsCreated: 3,
        removalsSkipped: 0,
      });

      const seedLoads = await db
        .select()
        .from(loads)
        .where(ilike(loads.notaFiscal, `${prefix}%`));
      expect(seedLoads).toHaveLength(3);
      for (const load of seedLoads) {
        expect(Number(load.nfWeight)).toBeGreaterThan(0);
        // one item was removed from each seeded load
        expect(load.itemCount).toBeGreaterThanOrEqual(14);
        expect(load.itemCount).toBeLessThanOrEqual(17);
      }

      const seedRemovals = await db
        .select()
        .from(removals)
        .where(ilike(removals.driver, `${prefix}%`));
      expect(seedRemovals).toHaveLength(3);
      for (const removal of seedRemovals) {
        expect(Number(removal.totalRemovedWeight)).toBeGreaterThan(0);
      }

    },
    20000,
  );

  it(
    "is idempotent: running twice does not duplicate rows",
    async () => {
      const prefix = `SEEDTEST-${randomUUID().slice(0, 8)}-`;
      prefixes.push(prefix);

      await seedDemoData({ loadCount: 2, removalCount: 2, prefix });
      const second = await seedDemoData({ loadCount: 2, removalCount: 2, prefix });

      expect(second).toEqual({
        loadsCreated: 0,
        loadsSkipped: 2,
        removalsCreated: 0,
        removalsSkipped: 2,
      });

      const seedLoads = await db
        .select()
        .from(loads)
        .where(ilike(loads.notaFiscal, `${prefix}%`));
      expect(seedLoads).toHaveLength(2);

      const seedRemovals = await db
        .select()
        .from(removals)
        .where(ilike(removals.driver, `${prefix}%`));
      expect(seedRemovals).toHaveLength(2);
    },
    20000,
  );

  it(
    "cleanDemoData removes all seeded loads, items and removals for the prefix",
    async () => {
      const prefix = `SEEDTEST-${randomUUID().slice(0, 8)}-`;

      await seedDemoData({ loadCount: 2, removalCount: 2, prefix });
      const result = await cleanDemoData(prefix);

      expect(result).toEqual({ loadsDeleted: 2, removalsDeleted: 2 });

      const remainingLoads = await db
        .select()
        .from(loads)
        .where(ilike(loads.notaFiscal, `${prefix}%`));
      expect(remainingLoads).toHaveLength(0);

      const remainingRemovals = await db
        .select()
        .from(removals)
        .where(ilike(removals.driver, `${prefix}%`));
      expect(remainingRemovals).toHaveLength(0);
    },
    20000,
  );
});
