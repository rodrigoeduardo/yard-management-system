import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { resolveMaterialId } from "@/lib/db/materials";
import { items, loads, removalItems, removals } from "@/lib/db/schema";

// `removeItems` now reads the acting user id via `next/headers` cookies
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

let removeItems: typeof import("./removals").removeItems;
beforeAll(async () => {
  ({ removeItems } = await import("./removals"));
});

async function insertLoadWithItems(itemWeights: string[]) {
  const { id: materialId } = await resolveMaterialId(db, "Aço");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-ACTION-${randomUUID()}`,
      entryDate: new Date("2026-01-01"),
      nfWeight: "1000",
      materialId,
      itemCount: itemWeights.length,
      remainingWeight: sumDecimalStrings(itemWeights),
    })
    .returning();

  const insertedItems = await db
    .insert(items)
    .values(itemWeights.map((weight) => ({ loadId: load.id, weight })))
    .returning();

  return { load, items: insertedItems };
}

describe("removeItems", () => {
  const loadIds: string[] = [];
  const removalIds: string[] = [];

  afterEach(async () => {
    while (removalIds.length > 0) {
      const id = removalIds.pop()!;
      await db.delete(removalItems).where(eq(removalItems.removalId, id));
      await db.delete(removals).where(eq(removals.id, id));
    }
    while (loadIds.length > 0) {
      const id = loadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it(
    "removes valid scanned items and returns the total removed weight",
    async () => {
      const load = await insertLoadWithItems(["10", "20"]);
      loadIds.push(load.load.id);

      const result = await removeItems({
        exitDateTime: "2026-02-01T14:35",
        driver: "John Doe",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      removalIds.push(result.removal.id);

      expect(result.removal.totalRemovedWeight).toBe("10");
    },
    20000,
  );

  it("rejects an empty qrTokens array without touching the database", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-01T14:35",
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      qrTokens: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing driver", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-01T14:35",
      driver: "",
      vehiclePlate: "ABC1234",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid exit date/time combination without touching the database", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-30T14:35",
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });

  it(
    "persists the exit date and time as a single combined instant",
    async () => {
      const load = await insertLoadWithItems(["10"]);
      loadIds.push(load.load.id);

      const result = await removeItems({
        exitDateTime: "2026-02-01T14:35",
        driver: "John Doe",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      removalIds.push(result.removal.id);

      expect(result.removal.exitDate.getUTCHours()).toBe(17);
      expect(result.removal.exitDate.getUTCMinutes()).toBe(35);
    },
    20000,
  );

  it("rejects an empty vehicle plate", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-01T14:35",
      driver: "John Doe",
      vehiclePlate: "",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only vehicle plate", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-01T14:35",
      driver: "John Doe",
      vehiclePlate: "   ",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });

  it(
    "persists the vehicle plate trimmed of surrounding whitespace",
    async () => {
      const load = await insertLoadWithItems(["10"]);
      loadIds.push(load.load.id);

      const result = await removeItems({
        exitDateTime: "2026-02-01T14:35",
        driver: "Vehicle Plate Test Driver",
        vehiclePlate: "  ABC1234  ",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      removalIds.push(result.removal.id);

      expect(result.removal.vehiclePlate).toBe("ABC1234");
    },
    20000,
  );

  it("rejects a missing pedidoImagePath", async () => {
    const result = await removeItems({
      exitDateTime: "2026-02-01T14:35",
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "",
      qrTokens: [randomUUID()],
    });

    expect(result.success).toBe(false);
  });

  it(
    "persists the pedido image storage path on the removal",
    async () => {
      const load = await insertLoadWithItems(["10"]);
      loadIds.push(load.load.id);

      const result = await removeItems({
        exitDateTime: "2026-02-01T14:35",
        driver: "Pedido Image Action Test Driver",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/action-test.jpg",
        qrTokens: [load.items[0].qrToken],
      });

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      removalIds.push(result.removal.id);

      expect(result.removal.pedidoImagePath).toBe(
        "removal-pedidos/action-test.jpg",
      );
    },
    20000,
  );
});
