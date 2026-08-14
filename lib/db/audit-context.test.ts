import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "../supabase/server";
import { withAuditUser } from "./audit-context";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import { auditLog, items, loads, removals } from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertLoadViaTx(tx: Tx, materialId: string) {
  const [load] = await tx
    .insert(loads)
    .values({
      notaFiscal: `NF-AUDIT-CONTEXT-${randomUUID()}`,
      entryDate: new Date(),
      nfWeight: "1",
      materialId,
    })
    .returning();
  return load;
}

describe("withAuditUser", () => {
  const createdLoadIds: string[] = [];
  const authedClient = createSupabaseServerClient();
  const authedViewerClient = createSupabaseServerClient();
  let userId: string;
  let viewerUserId: string;

  beforeAll(async () => {
    const { data, error } = await authedClient.auth.signInWithPassword({
      email: requireEnv("TEST_USER_EMAIL"),
      password: requireEnv("TEST_USER_PASSWORD"),
    });
    if (error || !data.user) {
      throw new Error(`Test user sign-in failed: ${error?.message}`);
    }
    userId = data.user.id;

    const { data: viewerData, error: viewerError } =
      await authedViewerClient.auth.signInWithPassword({
        email: requireEnv("VIEWER_USER_EMAIL"),
        password: requireEnv("VIEWER_USER_PASSWORD"),
      });
    if (viewerError || !viewerData.user) {
      throw new Error(`Viewer test user sign-in failed: ${viewerError?.message}`);
    }
    viewerUserId = viewerData.user.id;
  });

  afterAll(async () => {
    await authedClient.auth.signOut();
    await authedViewerClient.auth.signOut();
  });

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("stamps audit_log.user_id with the given user id for DML run inside the callback", async () => {
    const { id: materialId } = await resolveMaterialId(db, "steel");

    const load = await withAuditUser(userId, (tx) =>
      insertLoadViaTx(tx, materialId),
    );
    createdLoadIds.push(load.id);

    const [row] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, load.id));

    expect(row.userId).toBe(userId);
  });

  it("leaves audit_log.user_id null when userId is null", async () => {
    const { id: materialId } = await resolveMaterialId(db, "steel");

    const load = await withAuditUser(null, (tx) =>
      insertLoadViaTx(tx, materialId),
    );
    createdLoadIds.push(load.id);

    const [row] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, load.id));

    expect(row.userId).toBeNull();
  });

  it("returns the callback's return value", async () => {
    const result = await withAuditUser(null, async () => "ok" as const);

    expect(result).toBe("ok");
  });

  it("does not leak the user id onto the pooled connection after the transaction ends", async () => {
    const { id: materialId } = await resolveMaterialId(db, "steel");

    const attributed = await withAuditUser(userId, (tx) =>
      insertLoadViaTx(tx, materialId),
    );
    createdLoadIds.push(attributed.id);

    // A plain `db` insert right after, outside any withAuditUser call, must
    // not inherit the previous transaction's transaction-local setting —
    // set_config(..., true) is cleared when its transaction ends.
    const [unattributed] = await db
      .insert(loads)
      .values({
        notaFiscal: `NF-AUDIT-CONTEXT-LEAK-${randomUUID()}`,
        entryDate: new Date(),
        nfWeight: "1",
        materialId,
      })
      .returning();
    createdLoadIds.push(unattributed.id);

    const [row] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.recordId, unattributed.id));

    expect(row.userId).toBeNull();
  });

  describe("database-level viewer enforcement (issue #315)", () => {
    // Drizzle wraps the driver error in a `DrizzleQueryError` whose own
    // `.message` is a "Failed query: ..." summary, not the reason — the
    // real Postgres error (message "permission denied for table ...", code
    // 42501) is on `.cause`.
    async function expectPermissionDenied(promise: Promise<unknown>) {
      await expect(promise).rejects.toMatchObject({
        cause: expect.objectContaining({
          message: expect.stringMatching(/permission denied/i),
        }),
      });
    }

    it("raises on INSERT into loads for a viewer context", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");

      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) => insertLoadViaTx(tx, materialId)),
      );
    });

    it("raises on INSERT into items for a viewer context", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) =>
          tx.insert(items).values({ loadId: load.id, weight: "1", number: 1 }),
        ),
      );
    });

    it("raises on INSERT into removals for a viewer context", async () => {
      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) =>
          tx.insert(removals).values({
            exitDate: new Date(),
            driver: "Motorista Teste",
            pedidoImagePath: "removal-pedidos/audit-context-test.jpg",
            totalRemovedWeight: "1",
          }),
        ),
      );
    });

    it("raises on UPDATE of an existing load for a viewer context", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) =>
          tx.update(loads).set({ nfWeight: "2" }).where(eq(loads.id, load.id)),
        ),
      );
    });

    it("raises on DELETE of an existing load for a viewer context", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) =>
          tx.delete(loads).where(eq(loads.id, load.id)),
        ),
      );
    });

    it("allows SELECT on loads, items and removals for a viewer context", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");
      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      const [loadRows, itemRows, removalRows] = await withAuditUser(
        viewerUserId,
        async (tx) => {
          return Promise.all([
            tx.select().from(loads).where(eq(loads.id, load.id)),
            tx.select().from(items).where(eq(items.loadId, load.id)),
            tx.select().from(removals),
          ]);
        },
      );

      expect(loadRows).toHaveLength(1);
      expect(itemRows).toEqual([]);
      expect(removalRows).toEqual(expect.any(Array));
    });

    it("leaves an operator context unaffected: writes succeed and audit_log.user_id is stamped", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");

      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      const [row] = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, load.id));

      expect(row.userId).toBe(userId);
    });

    it("does not leak the viewer role onto the pooled connection: an operator write right after a viewer transaction still succeeds", async () => {
      const { id: materialId } = await resolveMaterialId(db, "steel");

      await expectPermissionDenied(
        withAuditUser(viewerUserId, (tx) => insertLoadViaTx(tx, materialId)),
      );

      const load = await withAuditUser(userId, (tx) =>
        insertLoadViaTx(tx, materialId),
      );
      createdLoadIds.push(load.id);

      const [row] = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.recordId, load.id));

      expect(row.userId).toBe(userId);
    });
  });
});
