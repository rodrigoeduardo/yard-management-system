"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  removalSearchHref,
  type RemovalQueryState,
} from "@/lib/inventory/removal-query";

/**
 * Navigates the current route to a new `rem_*` URL query state, merging
 * with (and preserving) every other search param, including the stock
 * section's independent `stock_*` namespace. Mirrors `useStockQueryNav`.
 */
export function useRemovalQueryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function navigateRemoval(updates: Partial<RemovalQueryState>) {
    router.push(`${pathname}${removalSearchHref(searchParams, updates)}`);
  };
}
