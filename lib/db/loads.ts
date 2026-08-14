import { and, asc, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import {
  STOCK_PAGE_SIZE,
  type StockOrderKey,
  type StockSortDir,
} from "@/lib/inventory/stock-query";
import { withAuditUser } from "./audit-context";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { resolveMaterialId } from "./materials";
import { items, loads, materials } from "./schema";
import { buildStockFilterConditions } from "./stock-filters";

export type CreateLoadData = {
  notaFiscal: string;
  /** Ordem de Transporte read off the inbound paperwork alongside the NF. */
  transportOrder: string;
  /** Inbound driver — distinct from `removals.driver` (the outbound driver). */
  driver: string;
  /** Calendar date printed on the invoice, `YYYY-MM-DD` — distinct from `entryDate`. */
  nfDate: string;
  entryDate: Date;
  nfWeight: string;
  /** An existing material's id, or a name to find-or-create — see `resolveMaterialId`. */
  material: string;
  itemWeights: string[];
  /**
   * Parallel to `itemWeights` — `itemCorridas[i]` is the heat/batch
   * identifier for `itemWeights[i]`. `null` persists as a NULL corrida
   * (#307).
   */
  itemCorridas: (string | null)[];
};

export async function insertLoadWithItems(
  data: CreateLoadData,
  userId: string | null = null,
) {
  const remainingWeight = sumDecimalStrings(data.itemWeights);

  return withAuditUser(userId, async (tx) => {
    const material = await resolveMaterialId(tx, data.material);

    const [load] = await tx
      .insert(loads)
      .values({
        notaFiscal: data.notaFiscal,
        transportOrder: data.transportOrder,
        driver: data.driver,
        nfDate: data.nfDate,
        entryDate: data.entryDate,
        nfWeight: data.nfWeight,
        materialId: material.id,
        itemCount: data.itemWeights.length,
        remainingWeight,
      })
      .returning();

    await tx.insert(items).values(
      data.itemWeights.map((weight, index) => ({
        loadId: load.id,
        weight,
        corrida: data.itemCorridas[index] ?? null,
        // The number printed on the item's label — 1..N in the order the
        // intake form's weight/Corrida fields were submitted. Immutable
        // from here on (#336).
        number: index + 1,
      })),
    );

    return { ...load, material: material.name };
  });
}

export async function getLoadWithItems(loadId: string) {
  const [load] = await db
    .select({
      id: loads.id,
      notaFiscal: loads.notaFiscal,
      transportOrder: loads.transportOrder,
      driver: loads.driver,
      nfDate: loads.nfDate,
      entryDate: loads.entryDate,
      nfWeight: loads.nfWeight,
      material: materials.name,
      itemCount: loads.itemCount,
      remainingWeight: loads.remainingWeight,
      createdAt: loads.createdAt,
      updatedAt: loads.updatedAt,
    })
    .from(loads)
    .innerJoin(materials, eq(loads.materialId, materials.id))
    .where(eq(loads.id, loadId));
  const loadItems = await db
    .select()
    .from(items)
    .where(eq(items.loadId, loadId))
    .orderBy(asc(items.number));

  return { load, items: loadItems };
}

const STOCK_ORDER_COLUMNS = {
  entryDate: loads.entryDate,
  nfWeight: loads.nfWeight,
  itemCount: loads.itemCount,
  remainingWeight: loads.remainingWeight,
} as const satisfies Record<StockOrderKey, unknown>;

export type StockPageParams = {
  /** Search term matched against NF number or material name (case-insensitive, partial). */
  q: string;
  order: StockOrderKey;
  dir: StockSortDir;
  /** 1-indexed page number. */
  page: number;
  pageSize?: number;
  /** Entry date range filter, `YYYY-MM-DD`, either bound optional. */
  dateFrom?: string;
  dateTo?: string;
  /** Remaining weight range filter, tonnes, either bound optional. */
  weightMin?: string;
  weightMax?: string;
  /** Omitted or `true` shows finished loads (default); `false` excludes them. */
  showFinished?: boolean;
};

export type StockRow = Omit<typeof loads.$inferSelect, "materialId"> & {
  material: string;
  /** Count of this load's items with `status = 'removed'` (issue #303). */
  removedItemCount: number;
};

export type StockPageResult = {
  rows: StockRow[];
  total: number;
};

/**
 * Server-side search, filtering, ordering and pagination for the Estoque
 * stock section. All filtering, ordering and slicing happens in SQL — never
 * fetches the full table and slices client-side.
 */
export async function listStockPage({
  q,
  order,
  dir,
  page,
  pageSize = STOCK_PAGE_SIZE,
  dateFrom,
  dateTo,
  weightMin,
  weightMax,
  showFinished,
}: StockPageParams): Promise<StockPageResult> {
  const trimmed = q.trim();
  const searchCondition = trimmed
    ? or(
        ilike(loads.notaFiscal, `%${trimmed}%`),
        ilike(materials.name, `%${trimmed}%`),
      )
    : undefined;

  const filterConditions = buildStockFilterConditions({
    dateFrom,
    dateTo,
    weightMin,
    weightMax,
    showFinished,
  });

  const conditions = [searchCondition, ...filterConditions].filter(
    (c): c is SQL => c !== undefined,
  );
  const whereClause: SQL | undefined =
    conditions.length > 0 ? and(...conditions) : undefined;

  const column = STOCK_ORDER_COLUMNS[order];
  const direction = dir === "asc" ? asc : desc;

  // Pre-aggregated per-load removed-item count. Joined (not inlined) so the
  // `loads`×`materials` join above stays 1:1 — joining `items` directly
  // would multiply rows before pagination/ordering runs.
  const removedCounts = db
    .select({
      loadId: items.loadId,
      removedItemCount:
        sql<number>`count(*) filter (where ${items.status} = 'removed')::int`.as(
          "removed_item_count",
        ),
    })
    .from(items)
    .groupBy(items.loadId)
    .as("removed_counts");

  const selectColumns = {
    id: loads.id,
    notaFiscal: loads.notaFiscal,
    // Not rendered as stock table columns (out of scope for #304/#305) —
    // carried through only so the load detail modal can show them.
    transportOrder: loads.transportOrder,
    driver: loads.driver,
    nfDate: loads.nfDate,
    entryDate: loads.entryDate,
    nfWeight: loads.nfWeight,
    material: materials.name,
    itemCount: loads.itemCount,
    remainingWeight: loads.remainingWeight,
    createdAt: loads.createdAt,
    updatedAt: loads.updatedAt,
    removedItemCount: sql<number>`coalesce(${removedCounts.removedItemCount}, 0)`,
  };

  const [rows, countRows] = await Promise.all([
    db
      .select(selectColumns)
      .from(loads)
      .innerJoin(materials, eq(loads.materialId, materials.id))
      .leftJoin(removedCounts, eq(loads.id, removedCounts.loadId))
      .where(whereClause)
      .orderBy(direction(column), desc(loads.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(loads)
      .innerJoin(materials, eq(loads.materialId, materials.id))
      .where(whereClause),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}
