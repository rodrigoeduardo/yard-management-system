import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createSupabaseServerClient } from "../supabase/server";
import { db } from "./index";
import { auditLog, loads } from "./schema";

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
      const { data: inserted, error } = await authedClient
        .from("loads")
        .insert({
          nota_fiscal: `NF-AUDIT-USER-${randomUUID()}`,
          entry_date: new Date().toISOString(),
          nf_weight: "1",
          material: "steel",
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

  describe("no auth session", () => {
    it("writes user_id = NULL and does not error", async () => {
      const [load] = await db
        .insert(loads)
        .values({
          notaFiscal: `NF-AUDIT-NOUSER-${randomUUID()}`,
          entryDate: new Date(),
          nfWeight: "1",
          material: "steel",
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
