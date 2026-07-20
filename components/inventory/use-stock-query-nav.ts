"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stockSearchHref, type StockQueryState } from "@/lib/inventory/stock-query";

/**
 * Navigates the current route to a new `stock_*` URL query state, merging
 * with (and preserving) every other search param. Follow-up sections that
 * introduce their own namespace (e.g. `removal_*`) should add an analogous
 * hook built on their own `*SearchHref` helper.
 *
 * The push is wrapped in `startTransition` so the previous rows stay
 * mounted (no blank/loading flash) while the new RSC payload streams in;
 * `isPending` lets callers show a subtle in-place indicator. `scroll: false`
 * keeps the page from jumping to the top on every query change.
 */
export function useStockQueryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigateStock(updates: Partial<StockQueryState>) {
    const href = `${pathname}${stockSearchHref(searchParams, updates)}`;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return { navigateStock, isPending };
}
