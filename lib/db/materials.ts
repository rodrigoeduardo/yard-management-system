import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { materials } from "./schema";

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
