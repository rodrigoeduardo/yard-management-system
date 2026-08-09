import { eq, inArray } from "drizzle-orm";
import { withAuditUser } from "./audit-context";
import { subtractDecimalStrings, sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { items, loads, removalItems, removals } from "./schema";

/** Fetches a single removal by id (e.g. for the printable receipt page, issue #270). */
export async function getRemovalById(removalId: string) {
  const [removal] = await db
    .select()
    .from(removals)
    .where(eq(removals.id, removalId));

  return removal;
}

export type CreateRemovalData = {
  exitDate: Date;
  driver: string;
  vehiclePlate: string;
  pedidoImagePath: string;
  qrTokens: string[];
};

export async function removeScannedItems(
  data: CreateRemovalData,
  userId: string | null = null,
) {
  return withAuditUser(userId, async (tx) => {
    const scannedItems = await tx
      .select()
      .from(items)
      .where(inArray(items.qrToken, data.qrTokens));

    if (scannedItems.length !== data.qrTokens.length) {
      throw new Error("One or more scanned items were not found");
    }
    if (scannedItems.some((item) => item.status === "removed")) {
      throw new Error("One or more scanned items have already been removed");
    }

    const totalRemovedWeight = sumDecimalStrings(
      scannedItems.map((item) => item.weight),
    );

    const [removal] = await tx
      .insert(removals)
      .values({
        exitDate: data.exitDate,
        driver: data.driver,
        vehiclePlate: data.vehiclePlate,
        pedidoImagePath: data.pedidoImagePath,
        totalRemovedWeight,
      })
      .returning();

    await tx.insert(removalItems).values(
      scannedItems.map((item) => ({
        removalId: removal.id,
        itemId: item.id,
      })),
    );

    await tx
      .update(items)
      .set({ status: "removed" })
      .where(
        inArray(
          items.id,
          scannedItems.map((item) => item.id),
        ),
      );

    const removedByLoad = new Map<
      string,
      { count: number; weights: string[] }
    >();
    for (const item of scannedItems) {
      const entry = removedByLoad.get(item.loadId) ?? {
        count: 0,
        weights: [],
      };
      entry.count += 1;
      entry.weights.push(item.weight);
      removedByLoad.set(item.loadId, entry);
    }

    for (const [loadId, { count, weights }] of removedByLoad) {
      const [load] = await tx
        .select()
        .from(loads)
        .where(eq(loads.id, loadId));

      await tx
        .update(loads)
        .set({
          itemCount: load.itemCount - count,
          remainingWeight: subtractDecimalStrings(
            load.remainingWeight,
            sumDecimalStrings(weights),
          ),
        })
        .where(eq(loads.id, loadId));
    }

    return removal;
  });
}

/**
 * Reverses a removal exactly (issue #310): stamps `cancelledAt`/`cancelledBy`,
 * sets every one of its items back to `in_stock`, and credits each affected
 * load's `itemCount`/`remainingWeight` back by that removal's contribution.
 * Mirrors `removeScannedItems`'s debit loop as a credit loop.
 *
 * The removal row is locked (`for("update")`) first so two concurrent
 * cancellations of the same removal can't both pass the already-cancelled
 * check, and each affected load is re-read with the same lock inside the
 * transaction before crediting, so two concurrent cancellations touching the
 * same load can't both read a stale `itemCount`/`remainingWeight`.
 */
export async function cancelRemoval(
  removalId: string,
  userId: string | null = null,
) {
  return withAuditUser(userId, async (tx) => {
    const [removal] = await tx
      .select()
      .from(removals)
      .where(eq(removals.id, removalId))
      .for("update");

    if (!removal) {
      throw new Error("Removal not found");
    }
    if (removal.cancelledAt !== null) {
      throw new Error("Removal is already cancelled");
    }

    const removedItemRows = await tx
      .select({
        id: items.id,
        loadId: items.loadId,
        weight: items.weight,
      })
      .from(removalItems)
      .innerJoin(items, eq(removalItems.itemId, items.id))
      .where(eq(removalItems.removalId, removalId));

    if (removedItemRows.length === 0) {
      throw new Error("Removal has no items to restore");
    }

    await tx
      .update(items)
      .set({ status: "in_stock" })
      .where(
        inArray(
          items.id,
          removedItemRows.map((item) => item.id),
        ),
      );

    const creditedByLoad = new Map<
      string,
      { count: number; weights: string[] }
    >();
    for (const item of removedItemRows) {
      const entry = creditedByLoad.get(item.loadId) ?? {
        count: 0,
        weights: [],
      };
      entry.count += 1;
      entry.weights.push(item.weight);
      creditedByLoad.set(item.loadId, entry);
    }

    for (const [loadId, { count, weights }] of creditedByLoad) {
      const [load] = await tx
        .select()
        .from(loads)
        .where(eq(loads.id, loadId))
        .for("update");

      await tx
        .update(loads)
        .set({
          itemCount: load.itemCount + count,
          remainingWeight: sumDecimalStrings([
            load.remainingWeight,
            sumDecimalStrings(weights),
          ]),
        })
        .where(eq(loads.id, loadId));
    }

    const [cancelled] = await tx
      .update(removals)
      .set({ cancelledAt: new Date(), cancelledBy: userId })
      .where(eq(removals.id, removalId))
      .returning();

    return cancelled;
  });
}
