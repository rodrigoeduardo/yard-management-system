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
      entryDate: "2026-01-01",
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

  it("rejects an item count above the sane maximum without touching the database", async () => {
    const notaFiscal = `NF-TOOMANY-${randomUUID()}`;

    const result = await createLoad({
      notaFiscal,
      entryDate: "2026-01-01",
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
      entryDate: "2026-01-01",
      nfWeight: 500,
      material: "Aço",
      itemWeights: [10, 0],
    });

    expect(result.success).toBe(false);
  });
});
