import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { insertLoadWithItems } from "./loads";
import { resolveMaterialId } from "./materials";
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
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name,
      itemWeights: ["10"],
    });
    createdLoadIds.push(loadA.id);

    const loadB = await insertLoadWithItems({
      notaFiscal: `NF-MAT-B-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "100",
      material: name.toUpperCase(),
      itemWeights: ["10"],
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
