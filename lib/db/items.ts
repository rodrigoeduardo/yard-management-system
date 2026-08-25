import { and, eq } from "drizzle-orm";
import { withAuditUser } from "./audit-context";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { items, loads } from "./schema";

export async function getItemStatusByQrToken(
  qrToken: string,
): Promise<"in_stock" | "removed" | null> {
  const [item] = await db
    .select({ status: items.status })
    .from(items)
    .where(eq(items.qrToken, qrToken));

  return item?.status ?? null;
}

/**
 * Corrects an in-stock item's recorded weight and recomputes its load's
 * remaining weight from every item still in stock. Recomputing inside the
 * audited transaction avoids delta drift when corrections race with removals.
 */
export async function updateItemWeight(
  itemId: string,
  weight: string,
  userId: string | null = null,
) {
  return withAuditUser(userId, async (tx) => {
    const [item] = await tx
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .for("update");

    if (!item) {
      throw new Error("Item not found");
    }
    if (item.status !== "in_stock") {
      throw new Error("Item is not in stock");
    }

    const [load] = await tx
      .select()
      .from(loads)
      .where(eq(loads.id, item.loadId))
      .for("update");

    if (!load) {
      throw new Error("Load not found");
    }

    const [updatedItem] = await tx
      .update(items)
      .set({ weight })
      .where(eq(items.id, item.id))
      .returning();

    const inStockItems = await tx
      .select({ weight: items.weight })
      .from(items)
      .where(
        and(eq(items.loadId, load.id), eq(items.status, "in_stock")),
      );

    await tx
      .update(loads)
      .set({
        remainingWeight: sumDecimalStrings(
          inStockItems.map((inStockItem) => inStockItem.weight),
        ),
      })
      .where(eq(loads.id, load.id));

    return updatedItem;
  });
}

/**
 * Corrects an in-stock item's recorded corrida. Unlike `updateItemWeight`,
 * corrida is descriptive only (`docs/specs/glossary.md`) and never
 * participates in scan/removal matching, so the transaction only locks and
 * updates the item row — no downstream load arithmetic to recompute.
 */
export async function updateItemCorrida(
  itemId: string,
  corrida: string,
  userId: string | null = null,
) {
  return withAuditUser(userId, async (tx) => {
    const [item] = await tx
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .for("update");

    if (!item) {
      throw new Error("Item not found");
    }
    if (item.status !== "in_stock") {
      throw new Error("Item is not in stock");
    }

    const [updatedItem] = await tx
      .update(items)
      .set({ corrida })
      .where(eq(items.id, item.id))
      .returning();

    return updatedItem;
  });
}
