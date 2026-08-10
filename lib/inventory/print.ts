import { formatEntryDateTime } from "@/lib/format/datetime";

/**
 * Row cap for the inventory overview print route (issue #309). Both the
 * stock and removal tables render up to this many rows — there is no
 * pagination on this route, so a set larger than the cap is truncated with
 * a visible note instead. This replaces `STOCK_PAGE_SIZE`/`REMOVAL_PAGE_SIZE`
 * as the `pageSize` passed to `listStockPage`/`listRemovalsPage` here.
 */
export const INVENTORY_PRINT_CAP = 500;

/**
 * Whether `pathname` is the inventory overview print route
 * (`/inventory/print`). Mirrors `isQrPrintRoute` (`lib/loads/print.ts`) and
 * `isReceiptPrintRoute` (`lib/removals/print.ts`) — used to keep the demo
 * banner off the printed output.
 */
export function isInventoryPrintRoute(pathname: string): boolean {
  return pathname === "/inventory/print";
}

/**
 * Formats the generation timestamp shown on the printed sheet, so a filed
 * copy is identifiable by when it was produced. Reuses the same yard-local
 * formatting as every other on-screen timestamp.
 */
export function formatGeneratedAt(date: Date): string {
  return formatEntryDateTime(date);
}

type SearchParamsRecord = Record<string, string | string[] | undefined>;

const RELEVANT_PREFIXES = ["stock_", "rem_"];

/**
 * Builds a query string carrying only the Estoque page's `stock_*`/`rem_*`
 * filter params — the namespaces `lib/inventory/stock-query.ts` and
 * `lib/inventory/removal-query.ts` parse. Used for both directions of the
 * link between `/inventory` and `/inventory/print`, so the printed set
 * can't drift from whichever filters produced it: the "Imprimir visão
 * geral" control on the Estoque page, and the print route's own back link.
 */
export function inventoryQueryString(
  searchParams: SearchParamsRecord,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!RELEVANT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      continue;
    }
    if (value === undefined) {
      continue;
    }
    const resolved = Array.isArray(value) ? value[0] : value;
    if (resolved !== undefined) {
      params.set(key, resolved);
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
