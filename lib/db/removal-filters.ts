import { gte, lte, type SQL } from "drizzle-orm";
import { YARD_UTC_OFFSET_MINUTES } from "@/lib/format/datetime";
import { removals } from "./schema";

/**
 * Exit date range and total removed weight range filters for the
 * Remoções (removal log) section, kept as a small pure module (no `./index`
 * import, no live DB connection) so the SQL condition-building can be unit
 * tested in isolation — see `removal-filters.test.ts`. Mirrors
 * `lib/db/stock-filters.ts`.
 */
export type RemovalDateWeightFilters = {
  /** `YYYY-MM-DD`, inclusive lower bound on `exitDate` (yard-local day). */
  dateFrom?: string;
  /** `YYYY-MM-DD`, inclusive upper bound on `exitDate` (yard-local day). */
  dateTo?: string;
  /** Kg, inclusive lower bound on `totalRemovedWeight`. */
  weightMin?: string;
  /** Kg, inclusive upper bound on `totalRemovedWeight`. */
  weightMax?: string;
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
export function buildRemovalFilterConditions(
  filters: RemovalDateWeightFilters,
): SQL[] {
  const conditions: SQL[] = [];

  if (filters.dateFrom) {
    conditions.push(gte(removals.exitDate, startOfYardDay(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(removals.exitDate, endOfYardDay(filters.dateTo)));
  }
  if (filters.weightMin) {
    conditions.push(gte(removals.totalRemovedWeight, filters.weightMin));
  }
  if (filters.weightMax) {
    conditions.push(lte(removals.totalRemovedWeight, filters.weightMax));
  }

  return conditions;
}
