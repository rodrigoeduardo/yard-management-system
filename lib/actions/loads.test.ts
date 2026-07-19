import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { items, loads } from "@/lib/db/schema";
import { createLoad } from "./loads";

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
      entryDateTime: "2026-01-01T09:30",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 20, 30],
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("expected success");
    createdLoadIds.push(result.load.id);

    expect(result.load.itemCount).toBe(3);
    expect(result.load.remainingWeight).toBe("60");
  });

  it("persists the chosen hour and minute instead of forcing midnight", async () => {
    const notaFiscal = `NF-TIME-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      entryDateTime: "2026-01-01T14:35",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
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
      entryDateTime: "",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
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
      entryDateTime: "2026-02-30T10:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.entryDateTime).toBeDefined();
  });

  it("rejects an item count above the sane maximum without touching the database", async () => {
    const notaFiscal = `NF-TOOMANY-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: Array.from({ length: 21 }, () => 10),
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
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0],
    });

    expect(result.success).toBe(false);
  });

  it("attributes an invalid item weight to its own index, not a flattened bucket", async () => {
    const result = await createLoad({
      notaFiscal: `NF-INDEXED-${randomUUID()}`,
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0, 30],
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
      entryDateTime: "2026-01-01T09:00",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected failure");
    expect(result.error.fieldErrors.notaFiscal).toBeDefined();
    expect(result.error.itemWeightErrors[1]).toBeDefined();
  });
});
