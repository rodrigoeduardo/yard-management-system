import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { createSupabaseServerClient } from "./server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

describe("Row Level Security on core tables", () => {
  const anonClient = createSupabaseServerClient();
  let authedClient: ReturnType<typeof createSupabaseServerClient>;
  let insertedLoadId: string;

  beforeAll(async () => {
    authedClient = createSupabaseServerClient();
    const { error } = await authedClient.auth.signInWithPassword({
      email: requireEnv("TEST_USER_EMAIL"),
      password: requireEnv("TEST_USER_PASSWORD"),
    });
    if (error) {
      throw new Error(`Test user sign-in failed: ${error.message}`);
    }
  });

  afterAll(async () => {
    if (insertedLoadId) {
      await authedClient.from("loads").delete().eq("id", insertedLoadId);
    }
    await authedClient.auth.signOut();
  });

  it("rejects an anonymous read on loads", async () => {
    const { data, error } = await anonClient.from("loads").select("id");

    expect(data).toEqual([]);
    expect(error).toBeNull();
  });

  it("rejects an anonymous write on loads", async () => {
    const { id: materialId } = await resolveMaterialId(db, "steel");
    const { error } = await anonClient.from("loads").insert({
      nota_fiscal: `NF-RLS-${randomUUID()}`,
      entry_date: new Date().toISOString(),
      nf_weight: "1",
      material_id: materialId,
    });

    expect(error).not.toBeNull();
  });

  it("allows an authenticated write and read on loads", async () => {
    const { id: materialId } = await resolveMaterialId(db, "steel");
    const { data, error } = await authedClient
      .from("loads")
      .insert({
        nota_fiscal: `NF-RLS-${randomUUID()}`,
        entry_date: new Date().toISOString(),
        nf_weight: "1",
        material_id: materialId,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    insertedLoadId = data!.id;

    const { data: readBack, error: readError } = await authedClient
      .from("loads")
      .select("id")
      .eq("id", insertedLoadId);

    expect(readError).toBeNull();
    expect(readBack).toHaveLength(1);
  });
});
