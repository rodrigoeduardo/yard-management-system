import { gt, gte, lte, or, type SQL } from "drizzle-orm";
import { YARD_UTC_OFFSET_MINUTES } from "@/lib/format/datetime";
import { loads } from "./schema";

/**
 * Entry date range and remaining weight range filters for the Estoque stock
 * section, kept as a small pure module (no `./index` import, no live DB
 * connection) so the SQL condition-building can be unit tested in isolation
 * — see `stock-filters.test.ts`.
 */
export type StockDateWeightFilters = {
  /** `YYYY-MM-DD`, inclusive lower bound on `entryDate` (yard-local day). */
  dateFrom?: string;
  /** `YYYY-MM-DD`, inclusive upper bound on `entryDate` (yard-local day). */
  dateTo?: string;
  /** Kg, inclusive lower bound on `remainingWeight`. */
  weightMin?: string;
  /** Kg, inclusive upper bound on `remainingWeight`. */
  weightMax?: string;
  /**
   * Whether finished loads (see `isLoadFinished` in `lib/inventory/stock.ts`)
   * are included. Omitted or `true` shows them (default, preserves current
   * behavior); `false` excludes them SQL-side.
   */
  showFinished?: boolean;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converts a `YYYY-MM-DD` wall-clock reading in the yard's timezone into the
 * absolute instant `msIntoDay` milliseconds after that day's start, mirroring
 * `combineEntryDateTime`'s construction (`lib/loads/entry-datetime.ts`): the
 * date's components are read as if they were UTC, then shifted by the yard's
 * fixed UTC offset to get the actual instant.
 */
function yardDayInstant(dateStr: string, msIntoDay: number): Date {
  const match = DATE_RE.exec(dateStr);
  const [, year, month, day] = match!.map(Number);
  const naiveUtc = Date.UTC(year, month - 1, day) + msIntoDay;
  return new Date(naiveUtc + YARD_UTC_OFFSET_MINUTES * 60_000);
}

/** Midnight at the start of `dateStr`, in the yard's local timezone. */
function startOfYardDay(dateStr: string): Date {
  return yardDayInstant(dateStr, 0);
}

/** The last millisecond of `dateStr`, in the yard's local timezone. */
function endOfYardDay(dateStr: string): Date {
  return yardDayInstant(dateStr, 24 * 60 * 60 * 1000 - 1);
}

/**
 * Builds the SQL conditions for the active date/weight filter bounds. Every
 * bound is independently optional — a single bound builds a plain
 * greater/less-than-or-equal condition; both bounds together build a range.
 * Returns an empty array when no filter is active.
 */
export function buildStockFilterConditions(
  filters: StockDateWeightFilters,
): SQL[] {
  const conditions: SQL[] = [];

  if (filters.dateFrom) {
    conditions.push(gte(loads.entryDate, startOfYardDay(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(loads.entryDate, endOfYardDay(filters.dateTo)));
  }
  if (filters.weightMin) {
    conditions.push(gte(loads.remainingWeight, filters.weightMin));
  }
  if (filters.weightMax) {
    conditions.push(lte(loads.remainingWeight, filters.weightMax));
  }

  if (filters.showFinished === false) {
    // Mirrors `isLoadFinished`'s negation and `activeLoads` in
    // `lib/db/dashboard.ts`: a load is "active" (not finished) when it still
    // has items or remaining weight.
    conditions.push(
      or(gt(loads.itemCount, 0), gt(loads.remainingWeight, "0"))!,
    );
  }

  return conditions;
}
