import { asc, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import {
  STOCK_PAGE_SIZE,
  type StockOrderKey,
  type StockSortDir,
} from "@/lib/inventory/stock-query";
import { sumDecimalStrings } from "./decimal";
import { db } from "./index";
import { items, loads } from "./schema";

export type CreateLoadData = {
  notaFiscal: string;
  entryDate: Date;
  nfWeight: string;
  material: string;
  itemWeights: string[];
};

export async function insertLoadWithItems(data: CreateLoadData) {
  const remainingWeight = sumDecimalStrings(data.itemWeights);

  return db.transaction(async (tx) => {
    const [load] = await tx
      .insert(loads)
      .values({
        notaFiscal: data.notaFiscal,
        entryDate: data.entryDate,
        nfWeight: data.nfWeight,
        material: data.material,
        itemCount: data.itemWeights.length,
        remainingWeight,
      })
      .returning();

    await tx.insert(items).values(
      data.itemWeights.map((weight) => ({
        loadId: load.id,
        weight,
      })),
    );

    return load;
  });
}

export async function getLoadWithItems(loadId: string) {
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId));
  const loadItems = await db
    .select()
    .from(items)
    .where(eq(items.loadId, loadId))
    .orderBy(asc(items.createdAt));

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
};

export type StockPageResult = {
  rows: (typeof loads.$inferSelect)[];
  total: number;
};

/**
 * Server-side search, ordering and pagination for the Estoque stock
 * section. All filtering, ordering and slicing happens in SQL — never
 * fetches the full table and slices client-side.
 */
export async function listStockPage({
  q,
  order,
  dir,
  page,
  pageSize = STOCK_PAGE_SIZE,
}: StockPageParams): Promise<StockPageResult> {
  const trimmed = q.trim();
  const whereClause: SQL | undefined = trimmed
    ? or(
        ilike(loads.notaFiscal, `%${trimmed}%`),
        ilike(loads.material, `%${trimmed}%`),
      )
    : undefined;

  const column = STOCK_ORDER_COLUMNS[order];
  const direction = dir === "asc" ? asc : desc;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(loads)
      .where(whereClause)
      .orderBy(direction(column), desc(loads.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(loads)
      .where(whereClause),
  ]);

  return { rows, total: countRows[0]?.count ?? 0 };
}
