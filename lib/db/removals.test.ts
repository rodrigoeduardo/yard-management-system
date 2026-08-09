import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import { cancelRemoval, getRemovalById, removeScannedItems } from "./removals";
import { items, loads, removalItems, removals } from "./schema";

async function insertLoadWithItems(itemWeights: string[]) {
  const { id: materialId } = await resolveMaterialId(db, "Aço");
  const [load] = await db
    .insert(loads)
    .values({
      notaFiscal: `NF-REMOVAL-${randomUUID()}`,
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

describe("removeScannedItems", () => {
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
    "removes items spanning two different loads in one transaction",
    async () => {
    const loadA = await insertLoadWithItems(["10", "20"]);
    const loadB = await insertLoadWithItems(["5"]);
    loadIds.push(loadA.load.id, loadB.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "John Doe",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "removal-pedidos/test.jpg",
      qrTokens: [
        loadA.items[0].qrToken,
        loadB.items[0].qrToken,
      ],
    });
    removalIds.push(removal.id);

    expect(removal.totalRemovedWeight).toBe("15");

    const removedItemA = await db
      .select()
      .from(items)
      .where(eq(items.id, loadA.items[0].id));
    expect(removedItemA[0].status).toBe("removed");

    const untouchedItemA = await db
      .select()
      .from(items)
      .where(eq(items.id, loadA.items[1].id));
    expect(untouchedItemA[0].status).toBe("in_stock");

    const reloadedLoadA = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadA.load.id));
    expect(reloadedLoadA[0].itemCount).toBe(1);
    expect(reloadedLoadA[0].remainingWeight).toBe("20");

    const reloadedLoadB = await db
      .select()
      .from(loads)
      .where(eq(loads.id, loadB.load.id));
    expect(reloadedLoadB[0].itemCount).toBe(0);
    expect(reloadedLoadB[0].remainingWeight).toBe("0");

    const junctionRows = await db
      .select()
      .from(removalItems)
      .where(eq(removalItems.removalId, removal.id));
    expect(junctionRows).toHaveLength(2);
    },
    20000,
  );

  it(
    "removes fractional item weights without floating-point drift",
    async () => {
      const load = await insertLoadWithItems(["10.1", "20.2"]);
      loadIds.push(load.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "John Doe",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken],
      });
      removalIds.push(removal.id);

      expect(removal.totalRemovedWeight).toBe("10.1");

      const reloadedLoad = await db
        .select()
        .from(loads)
        .where(eq(loads.id, load.load.id));
      expect(reloadedLoad[0].remainingWeight).toBe("20.2");
    },
    20000,
  );

  it("rolls back the entire transaction when one scanned item is already removed", async () => {
    // Unique per-run driver name: `removals.driver` is a shared, unfiltered
    // table, and this test asserts that *no* removal row exists for this
    // driver after the rollback. A hardcoded name (e.g. "John Doe") can
    // collide with unrelated concurrently-running test files inserting rows
    // with the same literal driver, causing a spurious failure.
    const uniqueDriver = `Rollback Test Driver ${randomUUID()}`;
    const load = await insertLoadWithItems(["10", "20"]);
    loadIds.push(load.load.id);

    await db
      .update(items)
      .set({ status: "removed" })
      .where(eq(items.id, load.items[0].id));

    await expect(
      removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: uniqueDriver,
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/test.jpg",
        qrTokens: [load.items[0].qrToken, load.items[1].qrToken],
      }),
    ).rejects.toThrow();

    const freshItem = await db
      .select()
      .from(items)
      .where(eq(items.id, load.items[1].id));
    expect(freshItem[0].status).toBe("in_stock");

    const reloadedLoad = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.load.id));
    expect(reloadedLoad[0].itemCount).toBe(2);
    expect(reloadedLoad[0].remainingWeight).toBe("30");

    const removalRows = await db
      .select()
      .from(removals)
      .where(eq(removals.driver, uniqueDriver));
    expect(removalRows).toHaveLength(0);
  });

  it("persists the vehicle plate on the removal row", async () => {
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Vehicle Plate Test Driver",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "pedidos/pedido-1.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    expect(removal.vehiclePlate).toBe("ABC1234");

    const reloaded = await db
      .select()
      .from(removals)
      .where(eq(removals.id, removal.id));
    expect(reloaded[0].vehiclePlate).toBe("ABC1234");
  });

  it("persists the pedido image storage path on the removal row", async () => {
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Pedido Image Test Driver",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "pedidos/pedido-image-test.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    expect(removal.pedidoImagePath).toBe("pedidos/pedido-image-test.jpg");

    const reloaded = await db
      .select()
      .from(removals)
      .where(eq(removals.id, removal.id));
    expect(reloaded[0].pedidoImagePath).toBe("pedidos/pedido-image-test.jpg");
  });
});

describe("cancelRemoval", () => {
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
    "credits a load's itemCount and remainingWeight back exactly and returns items to stock",
    async () => {
      const load = await insertLoadWithItems(["10", "20", "30"]);
      loadIds.push(load.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Cancel Test Driver",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/cancel-test.jpg",
        qrTokens: [load.items[0].qrToken, load.items[1].qrToken],
      });
      removalIds.push(removal.id);

      const cancelled = await cancelRemoval(removal.id);

      expect(cancelled.cancelledAt).not.toBeNull();

      const reloadedLoad = await db
        .select()
        .from(loads)
        .where(eq(loads.id, load.load.id));
      expect(reloadedLoad[0].itemCount).toBe(3);
      expect(reloadedLoad[0].remainingWeight).toBe("60");

      const reloadedItems = await db
        .select()
        .from(items)
        .where(eq(items.loadId, load.load.id));
      expect(reloadedItems.every((item) => item.status === "in_stock")).toBe(
        true,
      );
    },
    20000,
  );

  it(
    "credits each affected load its own items only when a removal spans two loads",
    async () => {
      const loadA = await insertLoadWithItems(["10", "20"]);
      const loadB = await insertLoadWithItems(["5"]);
      loadIds.push(loadA.load.id, loadB.load.id);

      const removal = await removeScannedItems({
        exitDate: new Date("2026-02-01"),
        driver: "Cancel Multi Load Driver",
        vehiclePlate: "ABC1234",
        pedidoImagePath: "removal-pedidos/cancel-multi.jpg",
        qrTokens: [loadA.items[0].qrToken, loadB.items[0].qrToken],
      });
      removalIds.push(removal.id);

      await cancelRemoval(removal.id);

      const reloadedLoadA = await db
        .select()
        .from(loads)
        .where(eq(loads.id, loadA.load.id));
      expect(reloadedLoadA[0].itemCount).toBe(2);
      expect(reloadedLoadA[0].remainingWeight).toBe("30");

      const reloadedLoadB = await db
        .select()
        .from(loads)
        .where(eq(loads.id, loadB.load.id));
      expect(reloadedLoadB[0].itemCount).toBe(1);
      expect(reloadedLoadB[0].remainingWeight).toBe("5");
    },
    20000,
  );

  it("rejects cancelling an already-cancelled removal and moves no counters", async () => {
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Double Cancel Driver",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "removal-pedidos/double-cancel.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    await cancelRemoval(removal.id);

    await expect(cancelRemoval(removal.id)).rejects.toThrow();

    const reloadedLoad = await db
      .select()
      .from(loads)
      .where(eq(loads.id, load.load.id));
    expect(reloadedLoad[0].itemCount).toBe(1);
    expect(reloadedLoad[0].remainingWeight).toBe("10");
  });

  it("stamps cancelledBy with the acting user id", async () => {
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Cancelled By Driver",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "removal-pedidos/cancelled-by.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    const userId = randomUUID();
    const cancelled = await cancelRemoval(removal.id, userId);

    expect(cancelled.cancelledBy).toBe(userId);
  });
});

describe("getRemovalById", () => {
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

  it("returns the removal row for the printable receipt (issue #270)", async () => {
    const load = await insertLoadWithItems(["10"]);
    loadIds.push(load.load.id);

    const removal = await removeScannedItems({
      exitDate: new Date("2026-02-01"),
      driver: "Receipt Test Driver",
      vehiclePlate: "REC0001",
      pedidoImagePath: "removal-pedidos/receipt-test.jpg",
      qrTokens: [load.items[0].qrToken],
    });
    removalIds.push(removal.id);

    const result = await getRemovalById(removal.id);

    expect(result?.id).toBe(removal.id);
    expect(result?.driver).toBe("Receipt Test Driver");
    expect(result?.vehiclePlate).toBe("REC0001");
    expect(result?.pedidoImagePath).toBe("removal-pedidos/receipt-test.jpg");
  });

  it("returns undefined for an unknown removal id", async () => {
    const result = await getRemovalById(randomUUID());

    expect(result).toBeUndefined();
  });
});
