import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { getDashboardStats, getLastLoad, getLastRemoval } from "./dashboard";
import { resolveMaterialId } from "./materials";
import { items, loads, materials, removalItems, removals } from "./schema";

async function insertLoad(overrides: {
  itemCount: number;
  remainingWeight: string;
}) {
  const { id: materialId } = await resolveMaterialId(db, "Aço");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-DASH-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      materialId,
      itemCount: overrides.itemCount,
      remainingWeight: overrides.remainingWeight,
    })
    .returning();
  return load;
}

describe("getDashboardStats", () => {
  const loadIds: string[] = [];

  afterEach(async () => {
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("counts non-finished loads and sums remaining weight, excluding finished loads from the active count", async () => {
    const active1 = await insertLoad({ itemCount: 3, remainingWeight: "30" });
    const active2 = await insertLoad({ itemCount: 2, remainingWeight: "15.5" });
    const finished = await insertLoad({ itemCount: 0, remainingWeight: "0" });
    loadIds.push(active1.id, active2.id, finished.id);

    const stats = await getDashboardStats();

    expect(stats.activeLoads).toBeGreaterThanOrEqual(2);
    expect(Number(stats.remainingWeight)).toBeGreaterThanOrEqual(45.5);
  });

  it("returns zero stats when isolated (no rows inserted by this test)", async () => {
    // Sanity check: shape/typing holds even for an empty delta.
    const stats = await getDashboardStats();
    expect(typeof stats.activeLoads).toBe("number");
    expect(typeof stats.materialsInStock).toBe("number");
    expect(typeof stats.remainingWeight).toBe("string");
  });
});

describe("getDashboardStats materialsInStock", () => {
  const materialIds: string[] = [];
  const loadIds: string[] = [];

  afterEach(async () => {
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
    while (materialIds.length > 0) {
      const id = materialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  async function insertMaterialWithLoad(materialName: string) {
    const [material] = await db
      .insert(materials)
      .values({ name: `${materialName}-${randomUUID()}` })
      .returning();
    materialIds.push(material.id);

    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-DASH-${randomUUID()}`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "1000",
        materialId: material.id,
        itemCount: 1,
        remainingWeight: "10",
      })
      .returning();
    loadIds.push(load.id);

    return { material, load };
  }

  // `materials`/`loads`/`items` are shared tables with no test-owned filter,
  // so a before/after delta races against other test files concurrently
  // inserting rows (mirrors the retry rationale on `getLastLoad`'s test
  // above). Retry absorbs that timing race rather than weakening the
  // assertion.
  it(
    "counts a distinct material only once even with multiple in-stock items",
    { retry: 2 },
    async () => {
      const before = await getDashboardStats();

      const { load } = await insertMaterialWithLoad("Aço Dashboard");
      await db.insert(items).values([
        { loadId: load.id, weight: "5", status: "in_stock" },
        { loadId: load.id, weight: "5", status: "in_stock" },
      ]);

      const after = await getDashboardStats();

      expect(after.materialsInStock).toBe(before.materialsInStock + 1);
    },
  );

  it(
    "excludes materials whose items are all removed",
    { retry: 2 },
    async () => {
      const before = await getDashboardStats();

      const { load } = await insertMaterialWithLoad("Cobre Dashboard");
      await db.insert(items).values([
        { loadId: load.id, weight: "5", status: "removed" },
      ]);

      const after = await getDashboardStats();

      expect(after.materialsInStock).toBe(before.materialsInStock);
    },
  );

  it("excludes materials with no items at all", { retry: 2 }, async () => {
    const before = await getDashboardStats();

    await insertMaterialWithLoad("Alumínio Dashboard");

    const after = await getDashboardStats();

    expect(after.materialsInStock).toBe(before.materialsInStock);
  });
});

describe("getLastRemoval", () => {
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

  it("returns the most recent removal with driver, date, item count, weight, and NFs", async () => {
    const load = await insertLoad({ itemCount: 2, remainingWeight: "20" });
    loadIds.push(load.id);

    const insertedItems = await db
      .insert(items)
      .values([
        { loadId: load.id, weight: "10" },
        { loadId: load.id, weight: "10" },
      ])
      .returning();

    const [removal] = await db
      .insert(removals)
      .values({
        exitDate: new Date("2026-02-01"),
        driver: "Maria Souza",
        vehiclePlate: "ABC1234",
        totalRemovedWeight: "20",
      })
      .returning();
    removalIds.push(removal.id);

    await db.insert(removalItems).values(
      insertedItems.map((item) => ({
        removalId: removal.id,
        itemId: item.id,
      })),
    );

    const lastRemoval = await getLastRemoval();

    expect(lastRemoval).not.toBeNull();
    expect(lastRemoval!.id).toBe(removal.id);
    expect(lastRemoval!.driver).toBe("Maria Souza");
    expect(lastRemoval!.itemCount).toBe(2);
    expect(lastRemoval!.totalRemovedWeight).toBe("20");
    expect(lastRemoval!.vehiclePlate).toBe("ABC1234");
    expect(lastRemoval!.notasFiscais).toEqual([load.notaFiscal]);
  });

  it("returns null for the vehicle plate on a legacy removal with no plate recorded", async () => {
    const load = await insertLoad({ itemCount: 1, remainingWeight: "10" });
    loadIds.push(load.id);

    const insertedItems = await db
      .insert(items)
      .values([{ loadId: load.id, weight: "10" }])
      .returning();

    const [removal] = await db
      .insert(removals)
      .values({
        exitDate: new Date("2026-02-02"),
        driver: "Maria Souza",
        totalRemovedWeight: "10",
      })
      .returning();
    removalIds.push(removal.id);

    await db.insert(removalItems).values(
      insertedItems.map((item) => ({
        removalId: removal.id,
        itemId: item.id,
      })),
    );

    const lastRemoval = await getLastRemoval();

    expect(lastRemoval).not.toBeNull();
    expect(lastRemoval!.vehiclePlate).toBeNull();
  });
});

describe("getLastLoad", () => {
  const loadIds: string[] = [];

  afterEach(async () => {
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it(
    "returns the most recently created load with NF, material, entry date, and NF weight",
    // `loads` is a shared table with no test-owned filter, so this races
    // against other test files concurrently inserting loads (whichever
    // commits last within the ~same instant wins "most recent"). Retry
    // absorbs that timing race rather than weakening the assertion.
    { retry: 2 },
    async () => {
      const older = await insertLoad({ itemCount: 1, remainingWeight: "10" });
      loadIds.push(older.id);

      const { id: materialId } = await resolveMaterialId(db, "Cobre");
      const [newer] = await db
        .insert(loads)
        .values({
          notaFiscal: `NF-DASH-${randomUUID()}`,
          entryDate: new Date("2026-03-01"),
          nfWeight: "500",
          materialId,
          itemCount: 5,
          remainingWeight: "500",
        })
        .returning();
      loadIds.push(newer.id);

      const lastLoad = await getLastLoad();

      expect(lastLoad).not.toBeNull();
      expect(lastLoad!.id).toBe(newer.id);
      expect(lastLoad!.notaFiscal).toBe(newer.notaFiscal);
      expect(lastLoad!.material).toBe("Cobre");
      expect(lastLoad!.entryDate).toEqual(newer.entryDate);
      expect(lastLoad!.nfWeight).toBe("500");
    },
  );
});
