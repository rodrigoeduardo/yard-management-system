"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stockSearchHref, type StockQueryState } from "@/lib/inventory/stock-query";

/**
 * Navigates the current route to a new `stock_*` URL query state, merging
 * with (and preserving) every other search param. Follow-up sections that
 * introduce their own namespace (e.g. `removal_*`) should add an analogous
 * hook built on their own `*SearchHref` helper.
 */
export function useStockQueryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function navigateStock(updates: Partial<StockQueryState>) {
    router.push(`${pathname}${stockSearchHref(searchParams, updates)}`);
  };
}
