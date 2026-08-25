import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads } from "@/lib/db/schema";

// `createLoad` now reads the acting user id via `next/headers` cookies
// (lib/auth/current-user.ts) to attribute the audit_log row. Outside a real
// Next.js request, `cookies()` throws — stub it to an empty store so these
// tests exercise the unauthenticated path (user_id stays null), same as
// app/login/actions.test.ts.
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  })),
}));

let createLoad: typeof import("./loads").createLoad;
let updateLoadAction: typeof import("./loads").updateLoadAction;
beforeAll(async () => {
  ({ createLoad, updateLoadAction } = await import("./loads"));
});

describe("createLoad", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("creates a load and its items from valid input", async () => {
    const notaFiscal = `NF-ACTION-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:30",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 20, 30],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    expect(result.load.itemCount).toBe(3);
    expect(result.load.remainingWeight).toBe("60");
  });

  it("persists each item's corrida matching what was typed for that item number", async () => {
    const notaFiscal = `NF-ACTION-CORRIDA-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:30",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 20],
      itemCorridas: ["C-4471", "C-9902"],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    const { items: loadItems } = await (
      await import("@/lib/db/loads")
    ).getLoadWithItems(result.load.id);
    expect(loadItems.map((item) => item.corrida).sort()).toEqual([
      "C-4471",
      "C-9902",
    ]);
  });

  it("rejects a payload with an empty corrida for one item, without touching the database", async () => {
    const notaFiscal = `NF-ACTION-NOCORRIDA-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:30",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 20, 30],
      itemCorridas: ["C-1", "", "C-3"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.itemCorridaErrors[1]).toBeDefined();

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("persists the chosen hour and minute instead of forcing midnight", async () => {
    const notaFiscal = `NF-TIME-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T14:35",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    expect(result.load.entryDate.getHours()).toBe(14);
    expect(result.load.entryDate.getMinutes()).toBe(35);
  });

  it("rejects a missing entry time without touching the database", async () => {
    const notaFiscal = `NF-NOTIME-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.entryDateTime).toBeDefined();

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("rejects a calendar date that does not exist, even with a valid time", async () => {
    const result = await createLoad({
      notaFiscal: `NF-BADDATE-${randomUUID()}`,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-02-30T10:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.entryDateTime).toBeDefined();
  });

  it("rejects an item count above the sane maximum without touching the database", async () => {
    const notaFiscal = `NF-TOOMANY-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: Array.from({ length: 21 }, () => 10),
      itemCorridas: Array.from({ length: 21 }, (_, i) => `C-${i}`),
    });

    expect(result.success).toBe(false);

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("rejects a non-positive item weight", async () => {
    const result = await createLoad({
      notaFiscal: `NF-BADWEIGHT-${randomUUID()}`,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0],
      itemCorridas: ["C-1", "C-2"],
    });

    expect(result.success).toBe(false);
  });

  it("attributes an invalid item weight to its own index, not a flattened bucket", async () => {
    const result = await createLoad({
      notaFiscal: `NF-INDEXED-${randomUUID()}`,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0, 30],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.itemWeightErrors[1]).toBeDefined();
    expect(result.error.itemWeightErrors[0]).toBeUndefined();
    expect(result.error.itemWeightErrors[2]).toBeUndefined();
  });

  it("preserves top-level field errors alongside per-index item weight errors", async () => {
    const result = await createLoad({
      notaFiscal: "",
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0],
      itemCorridas: ["C-1", "C-2"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.notaFiscal).toBeDefined();
    expect(result.error.itemWeightErrors[1]).toBeDefined();
  });

  it("rejects an empty driver without touching the database", async () => {
    const notaFiscal = `NF-NODRIVER-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.driver).toBeDefined();

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("rejects an empty transport order without touching the database", async () => {
    const notaFiscal = `NF-NOTRANSPORT-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "",
      driver: "João Silva",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.transportOrder).toBeDefined();

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("persists the transport order and driver on a valid submit", async () => {
    const notaFiscal = `NF-PERSIST-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-9912",
      driver: "Carlos Pereira",
      nfDate: "2026-01-01",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    const [row] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, result.load.id));
    expect(row.transportOrder).toBe("OT-9912");
    expect(row.driver).toBe("Carlos Pereira");
  });

  it("rejects an empty NF date without touching the database", async () => {
    const notaFiscal = `NF-NONFDATE-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.nfDate).toBeDefined();

    const rows = await db
      .select()
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));
    expect(rows).toHaveLength(0);
  });

  it("rejects an NF date that does not denote a real calendar date", async () => {
    const result = await createLoad({
      notaFiscal: `NF-BADNFDATE-${randomUUID()}`,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-02-30",
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.nfDate).toBeDefined();
  });

  it("persists the NF date separately from the entry date", async () => {
    const notaFiscal = `NF-NFDATE-PERSIST-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      transportOrder: "OT-0001",
      driver: "João Silva",
      nfDate: "2026-07-10",
      entryDateTime: "2026-07-12T14:30",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
      itemCorridas: ["C-1"],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    const [row] = await db
      .select()
      .from(loads)
      .where(eq(loads.id, result.load.id));
    expect(row.nfDate).toBe("2026-07-10");
    expect(row.entryDate.getUTCDate()).not.toBe(10);
  });
});

describe("updateLoadAction", () => {
  const createdLoadIds: string[] = [];
  const originalFlag = process.env.FEATURE_LOAD_EDIT;

  afterEach(async () => {
    if (originalFlag === undefined) {
      delete process.env.FEATURE_LOAD_EDIT;
    } else {
      process.env.FEATURE_LOAD_EDIT = originalFlag;
    }

    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  async function insertLoad(overrides: {
    notaFiscal: string;
    material?: string;
    removed?: boolean;
  }) {
    const { id: materialId } = await resolveMaterialId(
      db,
      overrides.material ?? "Aço",
    );
    const [load] = await db
      .insert(loads)
      .values({
        notaFiscal: overrides.notaFiscal,
        transportOrder: "OT-0001",
        driver: "João Silva",
        nfDate: "2026-01-01",
        entryDate: new Date("2026-01-01T12:00:00Z"),
        nfWeight: "500",
        materialId,
        itemCount: 1,
        remainingWeight: "10",
      })
      .returning();
    createdLoadIds.push(load.id);

    const [item] = await db
      .insert(items)
      .values({
        loadId: load.id,
        weight: "10",
        number: 1,
        status: overrides.removed ? "removed" : "in_stock",
      })
      .returning();

    return { load, item };
  }

  const validInput = (loadId: string, notaFiscal: string, material: string) => ({
    loadId,
    notaFiscal,
    transportOrder: "OT-9999",
    driver: "Maria",
    nfDate: "2026-03-15",
    entryDateTime: "2026-03-16T10:00",
    nfWeight: 999,
    material,
  });

  it("is inert while FEATURE_LOAD_EDIT is unset", async () => {
    delete process.env.FEATURE_LOAD_EDIT;
    const notaFiscal = `NF-EDIT-ACTION-DISABLED-${randomUUID()}`;
    const { load } = await insertLoad({ notaFiscal });

    const result = await updateLoadAction(
      validInput(load.id, `${notaFiscal}-X`, "Aço"),
    );

    expect(result.success).toBe(false);
    const [row] = await db.select().from(loads).where(eq(loads.id, load.id));
    expect(row.notaFiscal).toBe(notaFiscal);
  });

  it("persists every field when the flag is enabled and the load has no removed items", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const notaFiscal = `NF-EDIT-ACTION-OK-${randomUUID()}`;
    const { load } = await insertLoad({ notaFiscal });

    const result = await updateLoadAction(
      validInput(load.id, `${notaFiscal}-EDITED`, "Cobre"),
    );

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    expect(result.load.notaFiscal).toBe(`${notaFiscal}-EDITED`);
    expect(result.load.material).toBe("Cobre");
    expect(result.load.labelStale).toBe(true);
  });

  it("rejects invalid input with PT-BR field errors and no write", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const notaFiscal = `NF-EDIT-ACTION-INVALID-${randomUUID()}`;
    const { load } = await insertLoad({ notaFiscal });

    const result = await updateLoadAction({
      ...validInput(load.id, "", "Aço"),
      nfWeight: -5,
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected validation error");
    expect(result.error).toHaveProperty("fieldErrors");
    if (typeof result.error === "string") throw new Error("expected object");
    expect(result.error.fieldErrors.notaFiscal).toBeDefined();
    expect(result.error.fieldErrors.nfWeight).toBeDefined();

    const [row] = await db.select().from(loads).where(eq(loads.id, load.id));
    expect(row.notaFiscal).toBe(notaFiscal);
  });

  it("rejects changing Nota Fiscal on a load with a removed item, as a plain string error", async () => {
    process.env.FEATURE_LOAD_EDIT = "true";
    const notaFiscal = `NF-EDIT-ACTION-REMOVED-${randomUUID()}`;
    const { load } = await insertLoad({ notaFiscal, removed: true });

    const result = await updateLoadAction(
      validInput(load.id, `${notaFiscal}-CHANGED`, "Aço"),
    );

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(typeof result.error).toBe("string");
    expect(result.error).toMatch(/Nota Fiscal ou Material/);
  });
});
