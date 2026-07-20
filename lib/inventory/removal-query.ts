/**
 * URL-driven query state for the Remoções (removal log) section: search,
 * ordering and pagination, all namespaced under `rem_*` params so they can
 * live alongside the stock section's `stock_*` namespace without colliding.
 * Mirrors `lib/inventory/stock-query.ts` — see that file for the pattern
 * this was copied from.
 */

import { buildStatusLabel } from "./status-label";

export const REMOVAL_PAGE_SIZE = 10;

export const REMOVAL_ORDER_OPTIONS = [
  { key: "exitDate", label: "Data de Saída" },
  { key: "totalRemovedWeight", label: "Peso Total Removido" },
  { key: "itemCount", label: "Qtd. de Itens" },
] as const;

export type RemovalOrderKey = (typeof REMOVAL_ORDER_OPTIONS)[number]["key"];
export type RemovalSortDir = "asc" | "desc";

export const DEFAULT_REMOVAL_ORDER: RemovalOrderKey = "exitDate";
export const DEFAULT_REMOVAL_DIR: RemovalSortDir = "desc";

export type RemovalQueryState = {
  q: string;
  order: RemovalOrderKey;
  dir: RemovalSortDir;
  page: number;
  /** Exit date range filter, each bound optional, `YYYY-MM-DD`. */
  dateFrom?: string;
  dateTo?: string;
  /** Total removed weight range filter, each bound optional, kg as a numeric string. */
  weightMin?: string;
  weightMax?: string;
};

const PARAM_KEYS = {
  q: "rem_q",
  order: "rem_order",
  dir: "rem_dir",
  page: "rem_page",
  dateFrom: "rem_date_from",
  dateTo: "rem_date_to",
  weightMin: "rem_weight_min",
  weightMax: "rem_weight_max",
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

function isRemovalOrderKey(value: string | undefined): value is RemovalOrderKey {
  return REMOVAL_ORDER_OPTIONS.some((option) => option.key === value);
}

/** Parses namespaced `rem_*` params into a fully-defaulted query state. */
export function parseRemovalSearchParams(
  params: SearchParamsLike,
): RemovalQueryState {
  const q = readParam(params, PARAM_KEYS.q) ?? "";

  const orderRaw = readParam(params, PARAM_KEYS.order);
  const order = isRemovalOrderKey(orderRaw) ? orderRaw : DEFAULT_REMOVAL_ORDER;

  const dirRaw = readParam(params, PARAM_KEYS.dir);
  const dir: RemovalSortDir =
    dirRaw === "asc" || dirRaw === "desc" ? dirRaw : DEFAULT_REMOVAL_DIR;

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

  return {
    q,
    order,
    dir,
    page,
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
    ...(weightMin !== undefined ? { weightMin } : {}),
    ...(weightMax !== undefined ? { weightMax } : {}),
  };
}

/** Number of removal filters currently active (date range + weight range bounds). */
export function countActiveRemovalFilters(query: RemovalQueryState): number {
  return [query.dateFrom, query.dateTo, query.weightMin, query.weightMax].filter(
    (v) => v !== undefined && v !== "",
  ).length;
}

export function hasActiveRemovalFilters(query: RemovalQueryState): boolean {
  return countActiveRemovalFilters(query) > 0;
}

/** Dynamic status label reflecting the active order and filter state. */
export function removalStatusLabel(query: RemovalQueryState): string {
  const orderLabel =
    REMOVAL_ORDER_OPTIONS.find((option) => option.key === query.order)
      ?.label ?? query.order;
  return buildStatusLabel(
    orderLabel,
    query.dir,
    hasActiveRemovalFilters(query),
  );
}

/**
 * Builds the next query string for a partial update to the removal query
 * state, preserving every non-`rem_*` param untouched. Changing `q`, `order`
 * or `dir` resets `rem_page` back to page 1 (dropped from the URL); changing
 * `page` alone leaves search and order as they are.
 */
export function removalSearchHref(
  currentSearchParams: URLSearchParams,
  updates: Partial<RemovalQueryState>,
): string {
  const next = new URLSearchParams(currentSearchParams);
  const resetsPage =
    updates.q !== undefined ||
    updates.order !== undefined ||
    updates.dir !== undefined ||
    updates.dateFrom !== undefined ||
    updates.dateTo !== undefined ||
    updates.weightMin !== undefined ||
    updates.weightMax !== undefined;

  if (updates.q !== undefined) {
    if (updates.q) {
      next.set(PARAM_KEYS.q, updates.q);
    } else {
      next.delete(PARAM_KEYS.q);
    }
  }

  if (updates.order !== undefined) {
    if (updates.order === DEFAULT_REMOVAL_ORDER) {
      next.delete(PARAM_KEYS.order);
    } else {
      next.set(PARAM_KEYS.order, updates.order);
    }
  }

  if (updates.dir !== undefined) {
    if (updates.dir === DEFAULT_REMOVAL_DIR) {
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
