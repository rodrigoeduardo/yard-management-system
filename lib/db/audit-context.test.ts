import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "../supabase/server";
import { withAuditUser } from "./audit-context";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import { auditLog, loads } from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function insertLoadViaTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  materialId: string,
) {
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
});
