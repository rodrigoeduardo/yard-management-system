import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import { auditLog, items, loads, removals } from "./schema";

async function insertLoad() {
  const { id: materialId } = await resolveMaterialId(db, "steel");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-AUDIT-${randomUUID()}`,
      entryDate: new Date(),
      nfWeight: "100",
      materialId,
    })
    .returning();
  return load;
}

describe("audit_log triggers", () => {
  const createdLoadIds: string[] = [];
  const createdItemIds: string[] = [];
  const createdRemovalIds: string[] = [];

  afterEach(async () => {
    while (createdItemIds.length > 0) {
      const id = createdItemIds.pop()!;
      await db.delete(items).where(eq(items.id, id));
    }
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(loads).where(eq(loads.id, id));
    }
    while (createdRemovalIds.length > 0) {
      const id = createdRemovalIds.pop()!;
      await db.delete(removals).where(eq(removals.id, id));
    }
  });

  it("records an INSERT with new_data populated and old_data null", async () => {
    const load = await insertLoad();
    createdLoadIds.push(load.id);

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, load.id));

    expect(rows).toHaveLength(1);
    expect(rows[0].tableName).toBe("loads");
    expect(rows[0].action).toBe("INSERT");
    expect(rows[0].oldData).toBeNull();
    expect((rows[0].newData as { nota_fiscal: string }).nota_fiscal).toBe(
      load.notaFiscal,
    );
  });

  it("records an UPDATE with both old_data and new_data populated", async () => {
    const load = await insertLoad();
    createdLoadIds.push(load.id);

    const { id: newMaterialId } = await resolveMaterialId(db, "aluminum");
    await db
      .update(loads)
      .set({ materialId: newMaterialId })
      .where(eq(loads.id, load.id));

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, load.id));

    expect(rows).toHaveLength(2);
    const updateRow = rows.find((r) => r.action === "UPDATE")!;
    expect(updateRow).toBeDefined();
    expect(
      (updateRow.oldData as { material_id: string }).material_id,
    ).toBe(load.materialId);
    expect(
      (updateRow.newData as { material_id: string }).material_id,
    ).toBe(newMaterialId);
  });

  it("records a DELETE with old_data populated and new_data null", async () => {
    const load = await insertLoad();

    await db.delete(loads).where(eq(loads.id, load.id));

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, load.id));

    expect(rows).toHaveLength(2);
    const deleteRow = rows.find((r) => r.action === "DELETE")!;
    expect(deleteRow).toBeDefined();
    expect((deleteRow.oldData as { material_id: string }).material_id).toBe(
      load.materialId,
    );
    expect(deleteRow.newData).toBeNull();
  });

  it("records an INSERT for the items table", async () => {
    const load = await insertLoad();
    createdLoadIds.push(load.id);

    const [item] = await db
      .insert(items)
      .values({ loadId: load.id, weight: "10" })
      .returning();
    createdItemIds.push(item.id);

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, item.id));

    expect(rows).toHaveLength(1);
    expect(rows[0].tableName).toBe("items");
    expect(rows[0].action).toBe("INSERT");
  });

  it("records an INSERT for the removals table", async () => {
    const [removal] = await db
      .insert(removals)
      .values({
        exitDate: new Date(),
        driver: "John Doe",
        totalRemovedWeight: "0",
      })
      .returning();
    createdRemovalIds.push(removal.id);

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, removal.id));

    expect(rows).toHaveLength(1);
    expect(rows[0].tableName).toBe("removals");
    expect(rows[0].action).toBe("INSERT");
  });
});
