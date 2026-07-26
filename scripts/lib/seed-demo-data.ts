/**
 * Core logic for the synthetic demo-data seed script (see
 * `scripts/seed-demo-data.ts` for the CLI entry point and usage docs).
 *
 * Kept separate from the CLI wrapper so it can be unit/integration tested
 * directly (see `seed-demo-data.test.ts`) without going through `process.argv`.
 */
import { and, asc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { insertLoadWithItems } from "@/lib/db/loads";
import { removeScannedItems } from "@/lib/db/removals";
import { items, loads, removalItems, removals } from "@/lib/db/schema";

/** Default marker prefix identifying synthetic rows created by this script. */
export const DEFAULT_SEED_PREFIX = "SEED-";
export const DEFAULT_LOAD_COUNT = 30;
export const DEFAULT_REMOVAL_COUNT = 30;

const SEED_MATERIALS = ["Aço", "Alumínio", "Cobre", "Papelão", "Plástico"];

function pad(index: number): string {
  return index.toString().padStart(4, "0");
}

/** Deterministic, marker-prefixed NF for the load at this 1-indexed position. */
export function buildSeedNotaFiscal(prefix: string, index: number): string {
  return `${prefix}LOAD-${pad(index)}`;
}

/** Deterministic, marker-prefixed driver name for the removal at this 1-indexed position. */
export function buildSeedDriver(prefix: string, index: number): string {
  return `${prefix}DRIVER-${pad(index)}`;
}

/** Deterministic, marker-prefixed vehicle plate for the removal at this 1-indexed position. */
export function buildSeedVehiclePlate(prefix: string, index: number): string {
  return `${prefix}PLATE-${pad(index)}`;
}

/** Item count within the 15-18 typical range from business-rules.md. */
export function seedItemCount(index: number): number {
  return 15 + (index % 4);
}

export function seedMaterial(index: number): string {
  return SEED_MATERIALS[index % SEED_MATERIALS.length];
}

export function seedEntryDate(index: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - index * 86_400_000);
}

/**
 * Deterministic, positive per-item weights (kg, 2 decimals) for the load at
 * `index`. Same inputs always produce the same outputs, so re-running the
 * seed script never changes previously-inserted data.
 */
export function generateItemWeights(
  index: number,
  count: number = seedItemCount(index),
): string[] {
  return Array.from({ length: count }, (_, itemIndex) => {
    const grams = 2000 + ((index * 733 + itemIndex * 317) % 8000);
    return (grams / 100).toFixed(2);
  });
}

export type SeedOptions = {
  loadCount?: number;
  removalCount?: number;
  prefix?: string;
  now?: Date;
};

export type SeedSummary = {
  loadsCreated: number;
  loadsSkipped: number;
  removalsCreated: number;
  removalsSkipped: number;
};

/**
 * Idempotently seeds synthetic loads and removals marked with `prefix`.
 * Safe to re-run: existing rows (matched by their marker NF/driver) are
 * skipped rather than duplicated.
 */
export async function seedDemoData(
  options: SeedOptions = {},
): Promise<SeedSummary> {
  const {
    loadCount = DEFAULT_LOAD_COUNT,
    removalCount = DEFAULT_REMOVAL_COUNT,
    prefix = DEFAULT_SEED_PREFIX,
    now = new Date(),
  } = options;

  let loadsCreated = 0;
  let loadsSkipped = 0;

  for (let i = 1; i <= loadCount; i += 1) {
    const notaFiscal = buildSeedNotaFiscal(prefix, i);
    const [existing] = await db
      .select({ id: loads.id })
      .from(loads)
      .where(eq(loads.notaFiscal, notaFiscal));

    if (existing) {
      loadsSkipped += 1;
      continue;
    }

    const itemWeights = generateItemWeights(i);
    await insertLoadWithItems({
      notaFiscal,
      entryDate: seedEntryDate(i, now),
      // Consistent with the per-item weights (business rules only require
      // consistency, not that NF weight equal the item-weight sum).
      nfWeight: sumDecimalStrings(itemWeights),
      material: seedMaterial(i),
      itemWeights,
    });
    loadsCreated += 1;
  }

  const seedLoads = await db
    .select({ id: loads.id })
    .from(loads)
    .where(ilike(loads.notaFiscal, `${prefix}%`))
    .orderBy(asc(loads.notaFiscal));

  let removalsCreated = 0;
  let removalsSkipped = 0;

  for (let i = 1; i <= removalCount; i += 1) {
    const driver = buildSeedDriver(prefix, i);
    const [existing] = await db
      .select({ id: removals.id })
      .from(removals)
      .where(eq(removals.driver, driver));

    if (existing) {
      removalsSkipped += 1;
      continue;
    }

    if (seedLoads.length === 0) {
      throw new Error(
        "seedDemoData: no seed loads available to remove items from; increase loadCount.",
      );
    }

    const targetLoad = seedLoads[(i - 1) % seedLoads.length];
    const [availableItem] = await db
      .select({ qrToken: items.qrToken })
      .from(items)
      .where(
        and(eq(items.loadId, targetLoad.id), eq(items.status, "in_stock")),
      )
      .orderBy(asc(items.createdAt));

    if (!availableItem) {
      throw new Error(
        `seedDemoData: no in-stock items left on seed load to remove for "${driver}".`,
      );
    }

    await removeScannedItems({
      exitDate: seedEntryDate(-i, now), // exits after entries, spread across days
      driver,
      vehiclePlate: buildSeedVehiclePlate(prefix, i),
      // Seed data has no real attached Pedido image (issue #269) — a fixed
      // placeholder path keeps this idempotent seeding path type-correct
      // without implying a real Storage object exists.
      pedidoImagePath: "removal-pedidos/seed-placeholder.jpg",
      qrTokens: [availableItem.qrToken],
    });
    removalsCreated += 1;
  }

  return { loadsCreated, loadsSkipped, removalsCreated, removalsSkipped };
}

export type CleanSummary = {
  loadsDeleted: number;
  removalsDeleted: number;
};

/**
 * Deletes every synthetic row marked with `prefix` (loads, their items,
 * removals, and the removal_items linking them) in FK-safe order.
 */
export async function cleanDemoData(
  prefix: string = DEFAULT_SEED_PREFIX,
): Promise<CleanSummary> {
  const seedLoadRows = await db
    .select({ id: loads.id })
    .from(loads)
    .where(ilike(loads.notaFiscal, `${prefix}%`));
  const seedLoadIds = seedLoadRows.map((row) => row.id);

  const seedRemovalRows = await db
    .select({ id: removals.id })
    .from(removals)
    .where(ilike(removals.driver, `${prefix}%`));
  const seedRemovalIds = seedRemovalRows.map((row) => row.id);

  const seedItemRows = seedLoadIds.length
    ? await db
        .select({ id: items.id })
        .from(items)
        .where(inArray(items.loadId, seedLoadIds))
    : [];
  const seedItemIds = seedItemRows.map((row) => row.id);

  if (seedRemovalIds.length > 0) {
    await db
      .delete(removalItems)
      .where(inArray(removalItems.removalId, seedRemovalIds));
  }
  if (seedItemIds.length > 0) {
    await db
      .delete(removalItems)
      .where(inArray(removalItems.itemId, seedItemIds));
  }
  if (seedRemovalIds.length > 0) {
    await db.delete(removals).where(inArray(removals.id, seedRemovalIds));
  }
  if (seedItemIds.length > 0) {
    await db.delete(items).where(inArray(items.id, seedItemIds));
  }
  if (seedLoadIds.length > 0) {
    await db.delete(loads).where(inArray(loads.id, seedLoadIds));
  }

  return {
    loadsDeleted: seedLoadIds.length,
    removalsDeleted: seedRemovalIds.length,
  };
}
