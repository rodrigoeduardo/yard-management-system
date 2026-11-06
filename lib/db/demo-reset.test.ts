import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { asc, eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEMO_LOADS,
  DEMO_REMOVALS,
  FINISHED_LOAD_NOTA_FISCAL,
  MULTI_LOAD_REMOVAL_DRIVER,
} from "@/scripts/lib/demo-dataset";
import { withAuditUser } from "./audit-context";
import { resetDemoData, runNightlyDemoReset } from "./demo-reset";
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
      { loadId: load.id, weight: "5.00", number: 1 },
      { loadId: load.id, weight: "5.00", number: 2 },
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

        // reset_demo_data() must seed Ordem de Transporte and Motorista the
        // same way scripts/lib/demo-dataset.ts does (#304), so demo loads
        // look identical regardless of which seeding path created them.
        expect(load!.transportOrder).toBe(spec.transportOrder);
        expect(load!.driver).toBe(spec.driver);

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

const PEDIDO_BUCKET = "removal-pedidos";

// From inside the local stack's db container, the Storage API is reached
// through Kong's internal alias, not the host-mapped 127.0.0.1:54321.
const LOCAL_STORAGE_API_URL = "http://api.supabase.internal:8000";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function storageAdmin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  ).storage.from(PEDIDO_BUCKET);
}

async function uploadPedidoObject(): Promise<string> {
  const name = `${randomUUID()}.png`;
  const { error } = await storageAdmin().upload(
    name,
    new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    { contentType: "image/png" },
  );
  if (error) throw error;
  return name;
}

async function pedidoObjectExists(name: string): Promise<boolean> {
  const rows = await db.execute(
    sql`select 1 from storage.objects where bucket_id = ${PEDIDO_BUCKET} and name = ${name}`,
  );
  return rows.length > 0;
}

/** pg_net sends its queued requests asynchronously, after commit. */
async function waitUntilPedidoObjectGone(name: string): Promise<void> {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (!(await pedidoObjectExists(name))) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Pedido object ${name} was not deleted`);
}

async function setVaultSecret(name: string, value: string): Promise<void> {
  await db.execute(sql`delete from vault.secrets where name = ${name}`);
  await db.execute(sql`select vault.create_secret(${value}, ${name})`);
}

async function clearCleanupSecrets(): Promise<void> {
  await db.execute(
    sql`delete from vault.secrets where name in ('demo_storage_api_url', 'demo_storage_service_key')`,
  );
}

async function readLastResetAt(): Promise<Date | null> {
  const [row] = await db.execute<{ reset_at: string }>(
    sql`select reset_at::text from demo_reset_marker`,
  );
  return row ? new Date(row.reset_at) : null;
}

describe("runNightlyDemoReset", () => {
  beforeEach(async () => {
    await db.execute(sql`delete from demo_reset_marker`);
    await setVaultSecret("demo_storage_api_url", LOCAL_STORAGE_API_URL);
    await setVaultSecret(
      "demo_storage_service_key",
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
  });

  afterEach(async () => {
    await clearCleanupSecrets();
  });

  it(
    "deletes only the Pedido objects created after the previous reset",
    async () => {
      const beforeSeed = await uploadPedidoObject();

      // No previous reset recorded: nothing is deleted, the reset is recorded.
      await runNightlyDemoReset();
      expect(await pedidoObjectExists(beforeSeed)).toBe(true);
      expect(await readLastResetAt()).not.toBeNull();

      const afterSeed = await uploadPedidoObject();
      await runNightlyDemoReset();

      await waitUntilPedidoObjectGone(afterSeed);
      expect(await pedidoObjectExists(beforeSeed)).toBe(true);
    },
    30000,
  );

  it(
    "keeps a Pedido object created exactly at the previous reset",
    async () => {
      const atSeed = await uploadPedidoObject();
      await db.execute(sql`
        insert into demo_reset_marker (reset_at)
        select created_at from storage.objects
        where bucket_id = ${PEDIDO_BUCKET} and name = ${atSeed}
      `);
      const afterSeed = await uploadPedidoObject();

      await runNightlyDemoReset();

      await waitUntilPedidoObjectGone(afterSeed);
      expect(await pedidoObjectExists(atSeed)).toBe(true);
    },
    30000,
  );

  it(
    "still reseeds but skips the cleanup and keeps the previous reset time when its Vault secrets are missing",
    async () => {
      await runNightlyDemoReset();
      const previousResetAt = await readLastResetAt();
      const afterSeed = await uploadPedidoObject();
      await clearCleanupSecrets();
      await insertJunkData();

      await runNightlyDemoReset();

      expect(
        await db.select().from(loads).where(sql`nota_fiscal like 'JUNK-%'`),
      ).toEqual([]);
      expect(await readLastResetAt()).toEqual(previousResetAt);
      expect(await pedidoObjectExists(afterSeed)).toBe(true);
    },
    30000,
  );
});
