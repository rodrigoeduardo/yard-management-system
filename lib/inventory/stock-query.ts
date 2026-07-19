/**
 * URL-driven query state for the Estoque stock section: search, ordering and
 * pagination, all namespaced under `stock_*` params so they can live
 * alongside another section's params (e.g. a future `removal_*` namespace)
 * without colliding. This is the pattern follow-up sections should copy.
 */

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
};

const PARAM_KEYS = {
  q: "stock_q",
  order: "stock_order",
  dir: "stock_dir",
  page: "stock_page",
} as const;

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

  return { q, order, dir, page };
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
    updates.dir !== undefined;

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
