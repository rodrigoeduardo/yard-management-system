import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import {
  REMOVAL_PAGE_SIZE,
  type RemovalOrderKey,
  type RemovalSortDir,
} from "@/lib/inventory/removal-query";
import { db } from "./index";
import { buildRemovalFilterConditions } from "./removal-filters";
import { items, loads, removalItems, removals } from "./schema";

export async function listRemovalsMostRecentFirst() {
  return db.select().from(removals).orderBy(desc(removals.createdAt));
}

/**
 * Lists the NF for each removed item's originating load. When `removalIds`
 * is given, only rows for those removals are fetched (used to avoid
 * scanning every removal ever made when the caller only needs a single
 * page's worth).
 */
export async function listRemovalNfs(removalIds?: string[]) {
  return db
    .select({
      removalId: removalItems.removalId,
      notaFiscal: loads.notaFiscal,
    })
    .from(removalItems)
    .innerJoin(items, eq(removalItems.itemId, items.id))
    .innerJoin(loads, eq(items.loadId, loads.id))
    .where(
      removalIds !== undefined
        ? inArray(removalItems.removalId, removalIds)
        : undefined,
    );
}

/** Number of items removed in each removal, as a correlated subquery on `removal_items`. */
const itemCountExpr = sql<number>`(select count(*)::int from ${removalItems} where ${removalItems.removalId} = ${removals.id})`;

const REMOVAL_ORDER_EXPRESSIONS = {
  exitDate: removals.exitDate,
  totalRemovedWeight: removals.totalRemovedWeight,
  itemCount: itemCountExpr,
} as const satisfies Record<RemovalOrderKey, unknown>;

export type RemovalPageParams = {
  /** Search term matched against the driver name or an NF number of any removed item (case-insensitive, partial). */
  q: string;
  order: RemovalOrderKey;
  dir: RemovalSortDir;
  /** 1-indexed page number. */
  page: number;
  pageSize?: number;
  /** Exit date range filter, `YYYY-MM-DD`, either bound optional. */
  dateFrom?: string;
  dateTo?: string;
  /** Total removed weight range filter, tonnes, either bound optional. */
  weightMin?: string;
  weightMax?: string;
};

export type RemovalPageRow = typeof removals.$inferSelect & {
  itemCount: number;
};

export type RemovalPageResult = {
  rows: RemovalPageRow[];
  total: number;
};

/**
 * Server-side search, filtering, ordering and pagination for the Remoções
 * (removal log) section. All filtering, ordering and slicing happens in
 * SQL — never fetches the full table and slices client-side. Mirrors
 * `listStockPage` in `lib/db/loads.ts`.
 */
export async function listRemovalsPage({
  q,
  order,
  dir,
  page,
  pageSize = REMOVAL_PAGE_SIZE,
  dateFrom,
  dateTo,
  weightMin,
  weightMax,
}: RemovalPageParams): Promise<RemovalPageResult> {
  const trimmed = q.trim();
  const nfMatch = sql`exists (
    select 1 from ${removalItems}
    inner join ${items} on ${items.id} = ${removalItems.itemId}
    inner join ${loads} on ${loads.id} = ${items.loadId}
    where ${removalItems.removalId} = ${removals.id}
      and ${loads.notaFiscal} ilike ${`%${trimmed}%`}
  )`;

  const searchCondition = trimmed
    ? or(ilike(removals.driver, `%${trimmed}%`), nfMatch)
    : undefined;

  const filterConditions = buildRemovalFilterConditions({
    dateFrom,
    dateTo,
    weightMin,
    weightMax,
  });

  const conditions = [searchCondition, ...filterConditions].filter(
    (c): c is SQL => c !== undefined,
  );
  const whereClause: SQL | undefined =
    conditions.length > 0 ? and(...conditions) : undefined;

  const column = REMOVAL_ORDER_EXPRESSIONS[order];
  const direction = dir === "asc" ? asc : desc;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: removals.id,
        exitDate: removals.exitDate,
        driver: removals.driver,
        vehiclePlate: removals.vehiclePlate,
        pedidoImagePath: removals.pedidoImagePath,
        totalRemovedWeight: removals.totalRemovedWeight,
        createdAt: removals.createdAt,
        itemCount: itemCountExpr,
      })
      .from(removals)
      .where(whereClause)
      .orderBy(direction(column), desc(removals.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(removals)
      .where(whereClause),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}
