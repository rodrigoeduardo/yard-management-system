import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { items, loads, materials } from "./schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TransactionCallback = Parameters<typeof db.transaction>[0];
type Transaction = TransactionCallback extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

/**
 * The subset of the drizzle client used by `resolveMaterialId` — satisfied
 * by both `db` and a `db.transaction` callback's `tx`, so callers can pass
 * either and keep the resolution inside an existing transaction.
 */
type MaterialsClient = typeof db | Transaction;

export type ResolvedMaterial = { id: string; name: string };

/**
 * Resolves a load-creation `material` input to a materials row, creating
 * the material when it doesn't exist yet. Runs against whatever
 * client/transaction is passed in, so it can be composed inside
 * `insertLoadWithItems`'s transaction.
 *
 * - If `input` is a well-formed UUID, it's treated as an existing material's
 *   id — throws if no such material exists.
 * - Otherwise `input` is treated as a name: matched case-insensitively
 *   against existing materials, or inserted as a new one.
 */
export async function resolveMaterialId(
  client: MaterialsClient,
  input: string,
): Promise<ResolvedMaterial> {
  const trimmed = input.trim();

  if (UUID_RE.test(trimmed)) {
    const [existing] = await client
      .select({ id: materials.id, name: materials.name })
      .from(materials)
      .where(eq(materials.id, trimmed));
    if (!existing) {
      throw new Error(`Material not found: ${trimmed}`);
    }
    return existing;
  }

  const [existingByName] = await client
    .select({ id: materials.id, name: materials.name })
    .from(materials)
    .where(sql`lower(${materials.name}) = lower(${trimmed})`);
  if (existingByName) {
    return existingByName;
  }

  try {
    const [created] = await client
      .insert(materials)
      .values({ name: trimmed })
      .returning({ id: materials.id, name: materials.name });
    return created;
  } catch (error) {
    // Another concurrent insert may have won the race against the
    // case-insensitive unique index — fall back to reading it back.
    const [existingAfterRace] = await client
      .select({ id: materials.id, name: materials.name })
      .from(materials)
      .where(sql`lower(${materials.name}) = lower(${trimmed})`);
    if (existingAfterRace) {
      return existingAfterRace;
    }
    throw error;
  }
}

/** Thrown by `createMaterial`/`renameMaterial` on a case-insensitive name collision. */
export class MaterialNameConflictError extends Error {
  constructor(name: string) {
    super(`A material named "${name}" already exists.`);
    this.name = "MaterialNameConflictError";
  }
}

export type MaterialWithInStockCount = {
  id: string;
  name: string;
  inStockCount: number;
};

/**
 * Every persisted material with its count of `in_stock` items, including
 * materials with no loads at all (count 0). Ordered by name for the
 * Materials page listing.
 */
export async function getMaterialsWithInStockCounts(): Promise<
  MaterialWithInStockCount[]
> {
  const rows = await db
    .select({
      id: materials.id,
      name: materials.name,
      inStockCount: sql<number>`count(${items.id}) filter (where ${items.status} = 'in_stock')::int`,
    })
    .from(materials)
    .leftJoin(loads, eq(loads.materialId, materials.id))
    .leftJoin(items, eq(items.loadId, loads.id))
    .groupBy(materials.id, materials.name)
    .orderBy(materials.name);

  return rows;
}

/**
 * Creates a new material, rejecting names that already exist
 * case-insensitively (unlike `resolveMaterialId`, which silently resolves
 * to the existing row). Used by the Materials page's "Add material" dialog.
 */
export async function createMaterial(name: string): Promise<ResolvedMaterial> {
  const trimmed = name.trim();

  const [existing] = await db
    .select({ id: materials.id })
    .from(materials)
    .where(sql`lower(${materials.name}) = lower(${trimmed})`);
  if (existing) {
    throw new MaterialNameConflictError(trimmed);
  }

  try {
    const [created] = await db
      .insert(materials)
      .values({ name: trimmed })
      .returning({ id: materials.id, name: materials.name });
    return created;
  } catch {
    // Another concurrent insert may have won the race against the
    // case-insensitive unique index.
    throw new MaterialNameConflictError(trimmed);
  }
}

/**
 * Renames a material, rejecting names that collide case-insensitively with
 * another material (renaming to its own current name, in a different case,
 * is allowed). Used by the Materials page's inline "edit" dialog.
 */
export async function renameMaterial(
  id: string,
  name: string,
): Promise<ResolvedMaterial> {
  const trimmed = name.trim();

  const [conflict] = await db
    .select({ id: materials.id })
    .from(materials)
    .where(
      and(
        sql`lower(${materials.name}) = lower(${trimmed})`,
        ne(materials.id, id),
      ),
    );
  if (conflict) {
    throw new MaterialNameConflictError(trimmed);
  }

  try {
    const [updated] = await db
      .update(materials)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(eq(materials.id, id))
      .returning({ id: materials.id, name: materials.name });
    if (!updated) {
      throw new Error(`Material not found: ${id}`);
    }
    return updated;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Material not found")) {
      throw error;
    }
    // Another concurrent update may have won the race against the
    // case-insensitive unique index.
    throw new MaterialNameConflictError(trimmed);
  }
}
