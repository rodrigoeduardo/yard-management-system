import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "./index";
import { insertLoadWithItems } from "./loads";
import {
  createMaterial,
  getMaterialsWithInStockCounts,
  listMaterials,
  MaterialNameConflictError,
  renameMaterial,
  resolveMaterialId,
} from "./materials";
import { items, loads, materials } from "./schema";

describe("resolveMaterialId", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("creates a new material when the given name doesn't exist yet", async () => {
    const name = `Titânio-${randomUUID()}`;

    const resolved = await resolveMaterialId(db, name);
    createdMaterialIds.push(resolved.id);

    expect(resolved.name).toBe(name);

    const rows = await db
      .select()
      .from(materials)
      .where(eq(materials.id, resolved.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(name);
  });

  it("resolves an existing material by exact name instead of creating a duplicate", async () => {
    const name = `Bronze-${randomUUID()}`;
    const first = await resolveMaterialId(db, name);
    createdMaterialIds.push(first.id);

    const second = await resolveMaterialId(db, name);

    expect(second.id).toBe(first.id);
  });

  it("resolves an existing material case-insensitively, mapping case variants to the same row", async () => {
    const name = `Zinco-${randomUUID()}`;
    const created = await resolveMaterialId(db, name);
    createdMaterialIds.push(created.id);

    const upper = await resolveMaterialId(db, name.toUpperCase());
    const lower = await resolveMaterialId(db, name.toLowerCase());

    expect(upper.id).toBe(created.id);
    expect(lower.id).toBe(created.id);

    const rows = await db
      .select()
      .from(materials)
      .where(sql`lower(${materials.name}) = lower(${name})`);
    expect(rows).toHaveLength(1);
  });

  it("resolves directly by an existing material's id without creating a duplicate", async () => {
    const name = `Latão-${randomUUID()}`;
    const created = await resolveMaterialId(db, name);
    createdMaterialIds.push(created.id);

    const resolved = await resolveMaterialId(db, created.id);

    expect(resolved).toEqual(created);
  });

  it("throws when given an id that doesn't match any material", async () => {
    await expect(resolveMaterialId(db, randomUUID())).rejects.toThrow();
  });

  it("enforces case-insensitive uniqueness at the database level, independent of resolveMaterialId", async () => {
    const name = `Cromo-${randomUUID()}`;
    const [created] = await db
      .insert(materials)
      .values({ name })
      .returning();
    createdMaterialIds.push(created.id);

    await expect(
      db.insert(materials).values({ name: name.toUpperCase() }),
    ).rejects.toThrow();
  });
});

describe("materials backfill mapping (via insertLoadWithItems)", () => {
  const createdLoadIds: string[] = [];
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("maps loads created with the same material name (regardless of case) to one materials row — mirrors the migration's backfill grouping", async () => {
    const name = `Aço Carbono-${randomUUID()}`;

    const loadA = await insertLoadWithItems({
      notaFiscal: `NF-MAT-A-${randomUUID()}`,
      transportOrder: "OT-100001",
      driver: "João da Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name,
      itemWeights: ["10"],
      itemCorridas: ["C-1"],
    });
    createdLoadIds.push(loadA.id);

    const loadB = await insertLoadWithItems({
      notaFiscal: `NF-MAT-B-${randomUUID()}`,
      transportOrder: "OT-100002",
      driver: "Maria Oliveira",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name.toUpperCase(),
      itemWeights: ["10"],
      itemCorridas: ["C-1"],
    });
    createdLoadIds.push(loadB.id);

    const [rowA] = await db
      .select({ materialId: loads.materialId })
      .from(loads)
      .where(eq(loads.id, loadA.id));
    const [rowB] = await db
      .select({ materialId: loads.materialId })
      .from(loads)
      .where(eq(loads.id, loadB.id));

    expect(rowA.materialId).toBe(rowB.materialId);
    createdMaterialIds.push(rowA.materialId);

    const materialRows = await db
      .select()
      .from(materials)
      .where(sql`lower(${materials.name}) = lower(${name})`);
    expect(materialRows).toHaveLength(1);
  });
});

describe("getMaterialsWithInStockCounts", () => {
  const createdLoadIds: string[] = [];
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("includes a material with zero in-stock items, reporting a count of 0", async () => {
    const name = `Cobre-${randomUUID()}`;
    const created = await resolveMaterialId(db, name);
    createdMaterialIds.push(created.id);

    const rows = await getMaterialsWithInStockCounts();

    const row = rows.find((r) => r.id === created.id);
    expect(row).toBeDefined();
    expect(row?.inStockCount).toBe(0);
  });

  it("counts only in_stock items, excluding removed items, across a material's loads", async () => {
    const name = `Ferro-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal: `NF-MAT-COUNT-${randomUUID()}`,
      transportOrder: "OT-100003",
      driver: "Pedro Souza",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name,
      itemWeights: ["10", "20", "30"],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });
    createdLoadIds.push(load.id);

    const [loadRow] = await db
      .select({ materialId: loads.materialId })
      .from(loads)
      .where(eq(loads.id, load.id));
    createdMaterialIds.push(loadRow.materialId);

    const loadItems = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id));
    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, loadItems[0].id));

    const rows = await getMaterialsWithInStockCounts();

    const row = rows.find((r) => r.id === loadRow.materialId);
    expect(row?.inStockCount).toBe(2);
  });

  it("orders results by material name", async () => {
    const rows = await getMaterialsWithInStockCounts();

    const names = rows.map((r) => r.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it("includes a material with zero in-stock items, reporting a weight of \"0\"", async () => {
    const name = `Zinco-${randomUUID()}`;
    const created = await resolveMaterialId(db, name);
    createdMaterialIds.push(created.id);

    const rows = await getMaterialsWithInStockCounts();

    const row = rows.find((r) => r.id === created.id);
    expect(row).toBeDefined();
    expect(row?.inStockWeight).toBe("0");
  });

  it("sums only in_stock item weights as a decimal string, excluding removed items", async () => {
    const name = `Chumbo-${randomUUID()}`;

    const load = await insertLoadWithItems({
      notaFiscal: `NF-MAT-WEIGHT-${randomUUID()}`,
      transportOrder: "OT-100004",
      driver: "Pedro Souza",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name,
      itemWeights: ["0.1", "0.2", "50"],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });
    createdLoadIds.push(load.id);

    const [loadRow] = await db
      .select({ materialId: loads.materialId })
      .from(loads)
      .where(eq(loads.id, load.id));
    createdMaterialIds.push(loadRow.materialId);

    const loadItems = await db
      .select()
      .from(items)
      .where(eq(items.loadId, load.id));
    // Remove the 50 item, leaving only 0.1 and 0.2 in stock.
    const removed = loadItems.find((item) => item.weight === "50");
    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, removed!.id));

    const rows = await getMaterialsWithInStockCounts();

    const row = rows.find((r) => r.id === loadRow.materialId);
    expect(row?.inStockWeight).toBe("0.3");
  });
});

describe("createMaterial", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("creates a new material with the given name", async () => {
    const name = `Estanho-${randomUUID()}`;

    const created = await createMaterial(name);
    createdMaterialIds.push(created.id);

    expect(created.name).toBe(name);
  });

  it("throws MaterialNameConflictError when the name already exists case-insensitively", async () => {
    const name = `Prata-${randomUUID()}`;
    const created = await createMaterial(name);
    createdMaterialIds.push(created.id);

    await expect(createMaterial(name.toUpperCase())).rejects.toThrow(
      MaterialNameConflictError,
    );
  });

  it("propagates the original error instead of misreporting it as a name conflict when the insert fails for an unrelated reason", async () => {
    const name = `Rutênio-${randomUUID()}`;
    const dbError = new Error("connection reset by peer");
    // The insert now runs inside `withAuditUser`'s transaction, so failing
    // it directly means failing `db.transaction` itself (the transaction
    // never gets a chance to run its callback's `tx.insert`).
    const transactionSpy = vi
      .spyOn(db, "transaction")
      .mockImplementationOnce(() => {
        throw dbError;
      });

    await expect(createMaterial(name)).rejects.toBe(dbError);

    transactionSpy.mockRestore();
  });
});

describe("renameMaterial", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("renames a material", async () => {
    const original = await createMaterial(`Ouro-${randomUUID()}`);
    createdMaterialIds.push(original.id);
    const newName = `Ouro Renomeado-${randomUUID()}`;

    const renamed = await renameMaterial(original.id, newName);

    expect(renamed.name).toBe(newName);
    const [row] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, original.id));
    expect(row.name).toBe(newName);
  });

  it("throws MaterialNameConflictError when renaming to another material's name case-insensitively", async () => {
    const a = await createMaterial(`Níquel-${randomUUID()}`);
    createdMaterialIds.push(a.id);
    const b = await createMaterial(`Chumbo-${randomUUID()}`);
    createdMaterialIds.push(b.id);

    await expect(renameMaterial(a.id, b.name.toUpperCase())).rejects.toThrow(
      MaterialNameConflictError,
    );
  });

  it("allows renaming a material to its own current name (case-insensitive no-op)", async () => {
    const name = `Platina-${randomUUID()}`;
    const original = await createMaterial(name);
    createdMaterialIds.push(original.id);

    const renamed = await renameMaterial(original.id, name.toUpperCase());

    expect(renamed.id).toBe(original.id);
    expect(renamed.name).toBe(name.toUpperCase());
  });

  it("propagates the rename to loads referencing the material via FK", async () => {
    const name = `Vidro-${randomUUID()}`;
    const load = await insertLoadWithItems({
      notaFiscal: `NF-MAT-RENAME-${randomUUID()}`,
      transportOrder: "OT-100004",
      driver: "Ana Costa",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "50",
      material: name,
      itemWeights: ["5"],
      itemCorridas: ["C-1"],
    });

    const [loadRow] = await db
      .select({ materialId: loads.materialId })
      .from(loads)
      .where(eq(loads.id, load.id));
    createdMaterialIds.push(loadRow.materialId);

    const newName = `Vidro Renomeado-${randomUUID()}`;
    await renameMaterial(loadRow.materialId, newName);

    const [joined] = await db
      .select({ materialName: materials.name })
      .from(loads)
      .innerJoin(materials, eq(loads.materialId, materials.id))
      .where(eq(loads.id, load.id));

    expect(joined.materialName).toBe(newName);

    await db.delete(items).where(eq(items.loadId, load.id));
    await db.delete(loads).where(eq(loads.id, load.id));
  });

  it("propagates the original error instead of misreporting it as a name conflict when the update fails for an unrelated reason", async () => {
    const original = await createMaterial(`Cádmio-${randomUUID()}`);
    createdMaterialIds.push(original.id);
    const newName = `Cádmio Renomeado-${randomUUID()}`;
    const dbError = new Error("connection reset by peer");
    // The update now runs inside `withAuditUser`'s transaction, so failing
    // it directly means failing `db.transaction` itself (the transaction
    // never gets a chance to run its callback's `tx.update`).
    const transactionSpy = vi
      .spyOn(db, "transaction")
      .mockImplementationOnce(() => {
        throw dbError;
      });

    await expect(renameMaterial(original.id, newName)).rejects.toBe(dbError);

    transactionSpy.mockRestore();
  });
});

describe("listMaterials", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("returns every persisted material as an id/name pair, ordered by name", async () => {
    const suffix = randomUUID();
    const b = await createMaterial(`Zinco-${suffix}`);
    const a = await createMaterial(`Alumínio-${suffix}`);
    createdMaterialIds.push(a.id, b.id);

    const rows = await listMaterials();

    const aIndex = rows.findIndex((r) => r.id === a.id);
    const bIndex = rows.findIndex((r) => r.id === b.id);
    expect(aIndex).toBeGreaterThanOrEqual(0);
    expect(bIndex).toBeGreaterThanOrEqual(0);
    expect(aIndex).toBeLessThan(bIndex);
    expect(rows[aIndex]).toEqual({ id: a.id, name: `Alumínio-${suffix}` });
  });
});
