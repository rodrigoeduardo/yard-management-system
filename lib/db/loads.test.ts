import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { insertLoadWithItems, listStockPage } from "./loads";
import { resolveMaterialId } from "./materials";
import { items, loads } from "./schema";

describe("insertLoadWithItems", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("creates one load row and one item row per weight, with item_count and remaining_weight derived from the items", async () => {
    const notaFiscal = `NF-CREATE-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10", "20", "30"],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });
    createdLoadIds.push(load.id);

    expect(load.itemCount).toBe(3);
    expect(load.remainingWeight).toBe("60");

    const itemRows = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id));
    expect(itemRows).toHaveLength(3);
    expect(itemRows.map((i) => i.weight).sort()).toEqual(["10", "20", "30"]);
    expect(itemRows.every((i) => i.status === "in_stock")).toBe(true);
  });

  it("derives remaining_weight from fractional weights without floating-point drift", async () => {
    const notaFiscal = `NF-FRACTIONAL-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-0002",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10.1", "20.2"],
      itemCorridas: ["C-1", "C-2"],
    });
    createdLoadIds.push(load.id);

    expect(load.remainingWeight).toBe("30.3");
  });

  it("rolls back the load and all items when one item insert fails mid-transaction", async () => {
    const notaFiscal = `NF-ROLLBACK-${randomUUID()}`;

    await expect(
      insertLoadWithItems({
        notaFiscal,
        transportOrder: "OT-0003",
        driver: "João Silva",
        nfDate: "2026-01-01",
        entryDate: new Date("2026-01-01"),
        nfWeight: "500",
        material: "Aço",
        itemWeights: ["10", null as unknown as string],
        itemCorridas: ["C-1", "C-2"],
      }),
    ).rejects.toThrow();

    const loadRows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(loadRows).toHaveLength(0);
  });

  it("persists each item's corrida matching what was submitted for that item", async () => {
    const notaFiscal = `NF-CORRIDA-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-0004",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10", "20"],
      itemCorridas: ["C-4471", "C-9902"],
    });
    createdLoadIds.push(load.id);

    const itemRows = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id))
      .orderBy(items.sequence);
    expect(itemRows.map((i) => i.corrida)).toEqual(["C-4471", "C-9902"]);
  });

  it("persists a NULL corrida for an item whose corrida is not provided", async () => {
    const notaFiscal = `NF-CORRIDA-NULL-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-0005",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10"],
      itemCorridas: [null],
    });
    createdLoadIds.push(load.id);

    const [item] = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id));
    expect(item.corrida).toBeNull();
  });

  it("persists the submitted transport order and driver", async () => {
    const notaFiscal = `NF-TRANSPORT-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-4821",
      driver: "Maria Souza",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10"],
      itemCorridas: ["C-1"],
    });
    createdLoadIds.push(load.id);

    const [row] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(row.transportOrder).toBe("OT-4821");
    expect(row.driver).toBe("Maria Souza");
  });

  it("persists the submitted NF date, distinct from the entry date", async () => {
    const notaFiscal = `NF-NFDATE-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-4821",
      driver: "Maria Souza",
      nfDate: "2026-07-10",
      entryDate: new Date("2026-07-12T14:30:00Z"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10"],
      itemCorridas: ["C-1"],
    });
    createdLoadIds.push(load.id);

    const [row] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.id));
    expect(row.nfDate).toBe("2026-07-10");
  });
});

describe("listStockPage", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function seedLoad(overrides: {
    notaFiscal: string;
    entryDate: Date;
    nfWeight: string;
    material: string;
    itemCount: number;
    remainingWeight: string;
  }) {
    const { material, ...rest } = overrides;
    const { id: materialId } = await resolveMaterialId(db, material);
    const [load] = await db
      .insert(loads)
      .values({ ...rest, materialId })
      .returning();
    createdLoadIds.push(load.id);
    return load;
  }

  it(
    "matches the search term against the NF or material, case-insensitively",
    async () => {
      const marker = randomUUID();
      await seedLoad({
        notaFiscal: `NF-STOCK-${marker}-A`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        material: "Aço Inox",
        itemCount: 1,
        remainingWeight: "10",
      });
      await seedLoad({
        notaFiscal: `NF-OTHER-${marker}`,
        entryDate: new Date("2026-01-02"),
        nfWeight: "200",
        material: "Papelão",
        itemCount: 1,
        remainingWeight: "10",
      });

      const byNf = await listStockPage({
        q: `stock-${marker}`.toUpperCase(),
        order: "entryDate",
        dir: "desc",
        page: 1,
      });
      expect(byNf.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-STOCK-${marker}-A`,
      ]);
      expect(byNf.total).toBe(1);

      const byMaterial = await listStockPage({
        q: "papelão",
        order: "entryDate",
        dir: "desc",
        page: 1,
      });
      expect(
        byMaterial.rows.some((r) => r.notaFiscal === `NF-OTHER-${marker}`),
      ).toBe(true);
    },
    20000,
  );

  it(
    "orders by the requested column and direction",
    async () => {
      const marker = randomUUID();
      await seedLoad({
        notaFiscal: `NF-ORDER-${marker}-LIGHT`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "50",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "10",
      });
      await seedLoad({
        notaFiscal: `NF-ORDER-${marker}-HEAVY`,
        entryDate: new Date("2026-01-02"),
        nfWeight: "500",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "10",
      });

      const asc = await listStockPage({
        q: `NF-ORDER-${marker}`,
        order: "nfWeight",
        dir: "asc",
        page: 1,
      });
      expect(asc.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-ORDER-${marker}-LIGHT`,
        `NF-ORDER-${marker}-HEAVY`,
      ]);

      const desc = await listStockPage({
        q: `NF-ORDER-${marker}`,
        order: "nfWeight",
        dir: "desc",
        page: 1,
      });
      expect(desc.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-ORDER-${marker}-HEAVY`,
        `NF-ORDER-${marker}-LIGHT`,
      ]);
    },
    20000,
  );

  it(
    "paginates with SQL limit/offset and reports the total matching row count",
    async () => {
      const marker = randomUUID();
      for (let i = 0; i < 3; i += 1) {
        await seedLoad({
          notaFiscal: `NF-PAGE-${marker}-${i}`,
          entryDate: new Date(2026, 0, i + 1),
          nfWeight: "100",
          material: "Aço",
          itemCount: 1,
          remainingWeight: "10",
        });
      }

      const pageOne = await listStockPage({
        q: `NF-PAGE-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        pageSize: 2,
      });
      expect(pageOne.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-PAGE-${marker}-0`,
        `NF-PAGE-${marker}-1`,
      ]);
      expect(pageOne.total).toBe(3);

      const pageTwo = await listStockPage({
        q: `NF-PAGE-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 2,
        pageSize: 2,
      });
      expect(pageTwo.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-PAGE-${marker}-2`,
      ]);
      expect(pageTwo.total).toBe(3);
    },
    20000,
  );

  it(
    "returns an empty page (no error) when no row matches the search",
    async () => {
      const result = await listStockPage({
        q: `no-such-nf-${randomUUID()}`,
        order: "entryDate",
        dir: "desc",
        page: 1,
      });
      expect(result.rows).toEqual([]);
      expect(result.total).toBe(0);
    },
    20000,
  );

  it(
    "combines the entry date range and remaining weight range filters with search and ordering",
    async () => {
      const marker = randomUUID();
      await seedLoad({
        notaFiscal: `NF-FILTER-${marker}-EARLY-LIGHT`,
        entryDate: new Date("2026-01-01T12:00:00Z"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "50",
      });
      await seedLoad({
        notaFiscal: `NF-FILTER-${marker}-MID-HEAVY`,
        entryDate: new Date("2026-01-15T12:00:00Z"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "500",
      });
      await seedLoad({
        notaFiscal: `NF-FILTER-${marker}-LATE-LIGHT`,
        entryDate: new Date("2026-02-01T12:00:00Z"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "50",
      });

      // only-from: entries on/after 2026-01-10
      const onlyFrom = await listStockPage({
        q: `NF-FILTER-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        dateFrom: "2026-01-10",
      });
      expect(onlyFrom.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FILTER-${marker}-MID-HEAVY`,
        `NF-FILTER-${marker}-LATE-LIGHT`,
      ]);

      // only-to: entries on/before 2026-01-10
      const onlyTo = await listStockPage({
        q: `NF-FILTER-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        dateTo: "2026-01-10",
      });
      expect(onlyTo.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FILTER-${marker}-EARLY-LIGHT`,
      ]);

      // gt: remaining weight >= 100
      const gt = await listStockPage({
        q: `NF-FILTER-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        weightMin: "100",
      });
      expect(gt.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FILTER-${marker}-MID-HEAVY`,
      ]);

      // lt: remaining weight <= 100
      const lt = await listStockPage({
        q: `NF-FILTER-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        weightMax: "100",
      });
      expect(lt.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FILTER-${marker}-EARLY-LIGHT`,
        `NF-FILTER-${marker}-LATE-LIGHT`,
      ]);

      // range: weight between 40 and 60, combined with a date filter
      const range = await listStockPage({
        q: `NF-FILTER-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        dateFrom: "2026-01-10",
        weightMin: "40",
        weightMax: "60",
      });
      expect(range.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FILTER-${marker}-LATE-LIGHT`,
      ]);
    },
    20000,
  );

  it(
    "shows finished loads by default and excludes them SQL-side when showFinished is false",
    async () => {
      const marker = randomUUID();
      await seedLoad({
        notaFiscal: `NF-FINISHED-${marker}-ACTIVE`,
        entryDate: new Date("2026-01-01"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 1,
        remainingWeight: "10",
      });
      await seedLoad({
        notaFiscal: `NF-FINISHED-${marker}-DONE`,
        entryDate: new Date("2026-01-02"),
        nfWeight: "100",
        material: "Aço",
        itemCount: 0,
        remainingWeight: "0",
      });

      const defaultResult = await listStockPage({
        q: `NF-FINISHED-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
      });
      expect(defaultResult.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FINISHED-${marker}-ACTIVE`,
        `NF-FINISHED-${marker}-DONE`,
      ]);

      const shown = await listStockPage({
        q: `NF-FINISHED-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        showFinished: true,
      });
      expect(shown.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FINISHED-${marker}-ACTIVE`,
        `NF-FINISHED-${marker}-DONE`,
      ]);

      const hidden = await listStockPage({
        q: `NF-FINISHED-${marker}`,
        order: "entryDate",
        dir: "asc",
        page: 1,
        showFinished: false,
      });
      expect(hidden.rows.map((r) => r.notaFiscal)).toEqual([
        `NF-FINISHED-${marker}-ACTIVE`,
      ]);
      expect(hidden.total).toBe(1);
    },
    20000,
  );

  it("returns removedItemCount reflecting each load's removed items", async () => {
    const marker = randomUUID();
    const load = await seedLoad({
      notaFiscal: `NF-REMOVED-${marker}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: "Aço",
      itemCount: 4,
      remainingWeight: "40",
    });
    await db.insert(items).values([
      { loadId: load.id, weight: "10", status: "in_stock" },
      { loadId: load.id, weight: "10", status: "in_stock" },
      { loadId: load.id, weight: "10", status: "in_stock" },
      { loadId: load.id, weight: "10", status: "in_stock" },
      { loadId: load.id, weight: "10", status: "removed" },
      { loadId: load.id, weight: "10", status: "removed" },
      { loadId: load.id, weight: "10", status: "removed" },
      { loadId: load.id, weight: "10", status: "removed" },
      { loadId: load.id, weight: "10", status: "removed" },
      { loadId: load.id, weight: "10", status: "removed" },
    ]);

    const result = await listStockPage({
      q: `NF-REMOVED-${marker}`,
      order: "entryDate",
      dir: "asc",
      page: 1,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.removedItemCount).toBe(6);
  });

  it("returns removedItemCount 0 for a load with no items removed", async () => {
    const marker = randomUUID();
    const load = await seedLoad({
      notaFiscal: `NF-NOTREMOVED-${marker}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: "Aço",
      itemCount: 2,
      remainingWeight: "20",
    });
    await db.insert(items).values([
      { loadId: load.id, weight: "10", status: "in_stock" },
      { loadId: load.id, weight: "10", status: "in_stock" },
    ]);

    const result = await listStockPage({
      q: `NF-NOTREMOVED-${marker}`,
      order: "entryDate",
      dir: "asc",
      page: 1,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.removedItemCount).toBe(0);
  });
});
