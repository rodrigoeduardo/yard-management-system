import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";

// `createMaterialAction`/`renameMaterialAction` now read the acting user id
// via `next/headers` cookies (lib/auth/current-user.ts) to attribute the
// audit_log row. Outside a real Next.js request, `cookies()` throws — stub
// it to an empty store so these tests exercise the unauthenticated path
// (user_id stays null), same as app/login/actions.test.ts.
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}));

let createMaterialAction: typeof import("./materials").createMaterialAction;
let renameMaterialAction: typeof import("./materials").renameMaterialAction;
beforeAll(async () => {
  ({ createMaterialAction, renameMaterialAction } = await import(
    "./materials"
  ));
});

describe("createMaterialAction", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("creates a new material", async () => {
    const name = `Alumínio-${randomUUID()}`;

    const result = await createMaterialAction({ name });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdMaterialIds.push(result.material.id);
    expect(result.material.name).toBe(name);
  });

  it("rejects an empty name without touching the database", async () => {
    const result = await createMaterialAction({ name: "" });

    expect(result.success).toBe(false);
  });

  it("rejects a name that already exists case-insensitively", async () => {
    const name = `Cerâmica-${randomUUID()}`;
    const first = await createMaterialAction({ name });
    expect(first.success).toBe(true);
    if (!first.success) throw new Error("expected success");
    createdMaterialIds.push(first.material.id);

    const second = await createMaterialAction({ name: name.toUpperCase() });

    expect(second.success).toBe(false);
    if (second.success) throw new Error("expected failure");
    expect(second.error.fieldErrors.name).toBeDefined();
  });
});

describe("renameMaterialAction", () => {
  const createdMaterialIds: string[] = [];

  afterEach(async () => {
    while (createdMaterialIds.length > 0) {
      const id = createdMaterialIds.pop()!;
      await db.delete(materials).where(eq(materials.id, id));
    }
  });

  it("renames a material", async () => {
    const created = await createMaterialAction({
      name: `Madeira-${randomUUID()}`,
    });
    if (!created.success) throw new Error("expected success");
    createdMaterialIds.push(created.material.id);
    const newName = `Madeira Renomeada-${randomUUID()}`;

    const result = await renameMaterialAction({
      id: created.material.id,
      name: newName,
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.material.name).toBe(newName);
  });

  it("rejects an empty name without touching the database", async () => {
    const created = await createMaterialAction({
      name: `Papel-${randomUUID()}`,
    });
    if (!created.success) throw new Error("expected success");
    createdMaterialIds.push(created.material.id);

    const result = await renameMaterialAction({
      id: created.material.id,
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects renaming to a name that collides with another material case-insensitively", async () => {
    const a = await createMaterialAction({ name: `Plástico-${randomUUID()}` });
    if (!a.success) throw new Error("expected success");
    createdMaterialIds.push(a.material.id);
    const b = await createMaterialAction({ name: `Borracha-${randomUUID()}` });
    if (!b.success) throw new Error("expected success");
    createdMaterialIds.push(b.material.id);

    const result = await renameMaterialAction({
      id: a.material.id,
      name: b.material.name.toUpperCase(),
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.name).toBeDefined();
  });
});
