import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "../supabase/server";
import { db } from "./index";
import { insertLoadWithItems } from "./loads";
import { createMaterial, renameMaterial, resolveMaterialId } from "./materials";
import { removeScannedItems } from "./removals";
import {
  auditLog,
  items,
  loads,
  materials,
  removalItems,
  removals,
} from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

describe("audit_log.user_id", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  describe("authenticated session", () => {
    const authedClient = createSupabaseServerClient();
    let userId: string;

    beforeAll(async () => {
      const { data, error } = await authedClient.auth.signInWithPassword({
        email: requireEnv("TEST_USER_EMAIL"),
        password: requireEnv("TEST_USER_PASSWORD"),
      });
      if (error || !data.user) {
        throw new Error(`Test user sign-in failed: ${error?.message}`);
      }
      userId = data.user.id;
    });

    afterAll(async () => {
      await authedClient.auth.signOut();
    });

    it("writes the session's user id on a mutation by an authenticated client", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const { data: inserted, error } = await authedClient
        .from("loads")
        .insert({
          nota_fiscal: `NF-AUDIT-USER-${randomUUID()}`,
          entry_date: new Date().toISOString(),
          nf_weight: "1",
          material_id: materialId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(inserted).not.toBeNull();
      createdLoadIds.push(inserted!.id);

      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, inserted!.id));

      expect(rows).toHaveLength(1);
      expect(rows[0].userId).toBe(userId);
    });
  });

  describe("demo user session (DEMO_MODE)", () => {
    const authedClient = createSupabaseServerClient();
    let userId: string;

    beforeAll(async () => {
      const { data, error } = await authedClient.auth.signInWithPassword({
        email: requireEnv("DEMO_USER_EMAIL"),
        password: requireEnv("DEMO_USER_PASSWORD"),
      });
      if (error || !data.user) {
        throw new Error(`Demo user sign-in failed: ${error?.message}`);
      }
      userId = data.user.id;
    });

    afterAll(async () => {
      await authedClient.auth.signOut();
    });

    it("writes the demo user's id on a mutation, same as any other authenticated user", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const { data: inserted, error } = await authedClient
        .from("loads")
        .insert({
          nota_fiscal: `NF-AUDIT-DEMO-${randomUUID()}`,
          entry_date: new Date().toISOString(),
          nf_weight: "1",
          material_id: materialId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(inserted).not.toBeNull();
      createdLoadIds.push(inserted!.id);

      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, inserted!.id));

      expect(rows).toHaveLength(1);
      expect(rows[0].userId).toBe(userId);
    });
  });

  describe("app mutations via withAuditUser (lib/db/audit-context.ts)", () => {
    const authedClient = createSupabaseServerClient();
    let userId: string;
    const createdMaterialIds: string[] = [];
    const createdRemovalIds: string[] = [];

    beforeAll(async () => {
      const { data, error } = await authedClient.auth.signInWithPassword({
        email: requireEnv("TEST_USER_EMAIL"),
        password: requireEnv("TEST_USER_PASSWORD"),
      });
      if (error || !data.user) {
        throw new Error(`Test user sign-in failed: ${error?.message}`);
      }
      userId = data.user.id;
    });

    afterAll(async () => {
      await authedClient.auth.signOut();
    });

    afterEach(async () => {
      // Runs before the outer `afterEach` (nested hooks fire innermost
      // first), so items/removalItems referencing this describe's loads via
      // FK are gone before the outer hook deletes those loads.
      while (createdRemovalIds.length > 0) {
        const id = createdRemovalIds.pop()!;
        await db.delete(removalItems).where(eq(removalItems.removalId, id));
        await db.delete(removals).where(eq(removals.id, id));
      }
      for (const loadId of createdLoadIds) {
        await db.delete(items).where(eq(items.loadId, loadId));
      }
      while (createdMaterialIds.length > 0) {
        const id = createdMaterialIds.pop()!;
        await db.delete(materials).where(eq(materials.id, id));
      }
    });

    it("attributes the loads and items rows created by insertLoadWithItems to the acting user", async () => {
      const load = await insertLoadWithItems(
        {
          notaFiscal: `NF-AUDIT-CTX-${randomUUID()}`,
          transportOrder: "OT-900001",
          driver: "Carlos Mendes",
          entryDate: new Date(),
          nfWeight: "1",
          material: "steel",
          itemWeights: ["1"],
          itemCorridas: ["C-1"],
        },
        userId,
      );
      createdLoadIds.push(load.id);

      const loadAuditRows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, load.id));
      expect(loadAuditRows).toHaveLength(1);
      expect(loadAuditRows[0].userId).toBe(userId);

      const loadItems = await db
        .select()
        .from(items)
        .where(eq(items.loadId, load.id));
      const itemAuditRows = await db
        .select()
        .from(auditLog)
        .where(
          inArray(
            auditLog.recordId,
            loadItems.map((item) => item.id),
          ),
        );
      expect(itemAuditRows.length).toBeGreaterThan(0);
      for (const row of itemAuditRows) {
        expect(row.userId).toBe(userId);
      }
    });

    it("attributes the removals row and the removed items' update to the acting user", async () => {
      const load = await insertLoadWithItems({
        notaFiscal: `NF-AUDIT-CTX-REMOVE-${randomUUID()}`,
        transportOrder: "OT-900002",
        driver: "Fernanda Lima",
        entryDate: new Date(),
        nfWeight: "1",
        material: "steel",
        itemWeights: ["1"],
        itemCorridas: ["C-1"],
      });
      createdLoadIds.push(load.id);

      const [loadItem] = await db
        .select()
        .from(items)
        .where(eq(items.loadId, load.id));

      const removal = await removeScannedItems(
        {
          exitDate: new Date(),
          driver: "Audit Context Test Driver",
          vehiclePlate: "AUD1234",
          pedidoImagePath: "removal-pedidos/test.jpg",
          qrTokens: [loadItem.qrToken],
        },
        userId,
      );
      createdRemovalIds.push(removal.id);

      const removalAuditRows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, removal.id));
      expect(removalAuditRows).toHaveLength(1);
      expect(removalAuditRows[0].userId).toBe(userId);

      const itemUpdateAuditRows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, loadItem.id));
      const updateRow = itemUpdateAuditRows.find((r) => r.action === "UPDATE");
      expect(updateRow).toBeDefined();
      expect(updateRow?.userId).toBe(userId);
    });

    it("attributes the materials row created by createMaterial and updated by renameMaterial to the acting user", async () => {
      const created = await createMaterial(
        `Audit Context Material-${randomUUID()}`,
        userId,
      );
      createdMaterialIds.push(created.id);

      const createAuditRows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, created.id));
      const insertRow = createAuditRows.find((r) => r.action === "INSERT");
      expect(insertRow).toBeDefined();
      expect(insertRow?.userId).toBe(userId);

      await renameMaterial(
        created.id,
        `Audit Context Material Renamed-${randomUUID()}`,
        userId,
      );

      const renameAuditRows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, created.id));
      const updateRow = renameAuditRows.find((r) => r.action === "UPDATE");
      expect(updateRow).toBeDefined();
      expect(updateRow?.userId).toBe(userId);
    });
  });

  describe("no auth session", () => {
    it("writes user_id = NULL and does not error", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const [load] = await db
        .insert(loads)
        .values({
          notaFiscal: `NF-AUDIT-NOUSER-${randomUUID()}`,
          entryDate: new Date(),
          nfWeight: "1",
          materialId,
        })
        .returning();
      createdLoadIds.push(load.id);

      const rows = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, load.id));

      expect(rows).toHaveLength(1);
      expect(rows[0].userId).toBeNull();
    });
  });
});
