/**
 * URL-driven query state for the Estoque stock section: search, ordering and
 * pagination, all namespaced under `stock_*` params so they can live
 * alongside another section's params (e.g. a future `removal_*` namespace)
 * without colliding. This is the pattern follow-up sections should copy.
 */

import { buildStatusLabel } from "./status-label";

export const STOCK_PAGE_SIZE = 20;

export const STOCK_ORDER_OPTIONS = [
  { key: "entryDate", label: "Data de Entrada" },
  { key: "nfWeight", label: "Peso da NF" },
  { key: "itemCount", label: "Qtd. de Itens" },
  { key: "remainingWeight", label: "Peso Restante" },
] as const;

export type StockOrderKey = (typeof STOCK_ORDER_OPTIONS)[number]["key"];
export type StockSortDir = "asc" | "desc";

export const DEFAULT_STOCK_ORDER: StockOrderKey = "entryDate";
export const DEFAULT_STOCK_DIR: StockSortDir = "desc";

export type StockQueryState = {
  q: string;
  order: StockOrderKey;
  dir: StockSortDir;
  page: number;
  /** Entry date range filter, each bound optional, `YYYY-MM-DD`. */
  dateFrom?: string;
  dateTo?: string;
  /** Remaining weight range filter, each bound optional, kg as a numeric string. */
  weightMin?: string;
  weightMax?: string;
  /**
   * Whether finished loads are shown. Omitted means the default (shown,
   * preserving prior behavior) — only ever set to `false` (hidden), which is
   * why it's optional like the other filter bounds rather than always
   * present like `q`/`order`/`dir`/`page`.
   */
  showFinished?: boolean;
};

const PARAM_KEYS = {
  q: "stock_q",
  order: "stock_order",
  dir: "stock_dir",
  page: "stock_page",
  dateFrom: "stock_date_from",
  dateTo: "stock_date_to",
  weightMin: "stock_weight_min",
  weightMax: "stock_weight_max",
  showFinished: "stock_show_finished",
} as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateParam(value: string | undefined): value is string {
  return value !== undefined && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function isValidWeightParam(value: string | undefined): value is string {
  if (value === undefined) {
    return false;
  }
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) && n >= 0;
}

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsLike = URLSearchParams | SearchParamsRecord;

function readParam(params: SearchParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isStockOrderKey(value: string | undefined): value is StockOrderKey {
  return STOCK_ORDER_OPTIONS.some((option) => option.key === value);
}

/** Parses namespaced `stock_*` params into a fully-defaulted query state. */
export function parseStockSearchParams(
  params: SearchParamsLike,
): StockQueryState {
  const q = readParam(params, PARAM_KEYS.q) ?? "";

  const orderRaw = readParam(params, PARAM_KEYS.order);
  const order = isStockOrderKey(orderRaw) ? orderRaw : DEFAULT_STOCK_ORDER;

  const dirRaw = readParam(params, PARAM_KEYS.dir);
  const dir: StockSortDir =
    dirRaw === "asc" || dirRaw === "desc" ? dirRaw : DEFAULT_STOCK_DIR;

  const pageRaw = readParam(params, PARAM_KEYS.page);
  const pageNumber = pageRaw === undefined ? Number.NaN : Number(pageRaw);
  const page =
    Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const dateFromRaw = readParam(params, PARAM_KEYS.dateFrom);
  const dateFrom = isValidDateParam(dateFromRaw) ? dateFromRaw : undefined;

  const dateToRaw = readParam(params, PARAM_KEYS.dateTo);
  const dateTo = isValidDateParam(dateToRaw) ? dateToRaw : undefined;

  const weightMinRaw = readParam(params, PARAM_KEYS.weightMin);
  const weightMin = isValidWeightParam(weightMinRaw) ? weightMinRaw : undefined;

  const weightMaxRaw = readParam(params, PARAM_KEYS.weightMax);
  const weightMax = isValidWeightParam(weightMaxRaw) ? weightMaxRaw : undefined;

  const showFinishedRaw = readParam(params, PARAM_KEYS.showFinished);
  const showFinished = showFinishedRaw === "0" ? false : undefined;

  return {
    q,
    order,
    dir,
    page,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
    ...(weightMin !== undefined ? { weightMin } : {}),
    ...(weightMax !== undefined ? { weightMax } : {}),
    ...(showFinished !== undefined ? { showFinished } : {}),
  };
}

/**
 * Number of stock filters currently active (date range + weight range bounds,
 * plus `showFinished` when it's set to its non-default "hidden" value).
 */
export function countActiveStockFilters(query: StockQueryState): number {
  const rangeFilterCount = [
    query.dateFrom,
    query.dateTo,
    query.weightMin,
    query.weightMax,
  ].filter((v) => v !== undefined && v !== "").length;

  return rangeFilterCount + (query.showFinished === false ? 1 : 0);
}

export function hasActiveStockFilters(query: StockQueryState): boolean {
  return countActiveStockFilters(query) > 0;
}

/** Dynamic status label reflecting the active order and filter state. */
export function stockStatusLabel(query: StockQueryState): string {
  const orderLabel =
    STOCK_ORDER_OPTIONS.find((option) => option.key === query.order)?.label ??
    query.order;
  return buildStatusLabel(orderLabel, query.dir, hasActiveStockFilters(query));
}

/**
 * Builds the next query string for a partial update to the stock query
 * state, preserving every non-`stock_*` param untouched. Changing `q`,
 * `order` or `dir` resets `stock_page` back to page 1 (dropped from the
 * URL); changing `page` alone leaves search and order as they are.
 */
export function stockSearchHref(
  currentSearchParams: URLSearchParams,
  updates: Partial<StockQueryState>,
): string {
  const next = new URLSearchParams(currentSearchParams);
  const resetsPage =
    updates.q !== undefined ||
    updates.order !== undefined ||
    updates.dir !== undefined ||
    updates.dateFrom !== undefined ||
    updates.dateTo !== undefined ||
    updates.weightMin !== undefined ||
    updates.weightMax !== undefined ||
    updates.showFinished !== undefined;

  if (updates.q !== undefined) {
    if (updates.q) {
      next.set(PARAM_KEYS.q, updates.q);
    } else {
      next.delete(PARAM_KEYS.q);
    }
  }

  if (updates.order !== undefined) {
    if (updates.order === DEFAULT_STOCK_ORDER) {
      next.delete(PARAM_KEYS.order);
    } else {
      next.set(PARAM_KEYS.order, updates.order);
    }
  }

  if (updates.dir !== undefined) {
    if (updates.dir === DEFAULT_STOCK_DIR) {
      next.delete(PARAM_KEYS.dir);
    } else {
      next.set(PARAM_KEYS.dir, updates.dir);
    }
  }

  for (const key of ["dateFrom", "dateTo", "weightMin", "weightMax"] as const) {
    const value = updates[key];
    if (value !== undefined) {
      if (value) {
        next.set(PARAM_KEYS[key], value);
      } else {
        next.delete(PARAM_KEYS[key]);
      }
    }
  }

  if (updates.showFinished !== undefined) {
    if (updates.showFinished) {
      next.delete(PARAM_KEYS.showFinished);
    } else {
      next.set(PARAM_KEYS.showFinished, "0");
    }
  }

  if (resetsPage) {
    next.delete(PARAM_KEYS.page);
  } else if (updates.page !== undefined) {
    if (updates.page <= 1) {
      next.delete(PARAM_KEYS.page);
    } else {
      next.set(PARAM_KEYS.page, String(updates.page));
    }
  }

  const sorted = new URLSearchParams(
    [...next.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
  const qs = sorted.toString();
  return qs ? `?${qs}` : "";
}
