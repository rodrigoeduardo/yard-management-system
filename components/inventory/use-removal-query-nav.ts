"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  removalSearchHref,
  type RemovalQueryState,
} from "@/lib/inventory/removal-query";

/**
 * Navigates the current route to a new `rem_*` URL query state, merging
 * with (and preserving) every other search param, including the stock
 * section's independent `stock_*` namespace. Mirrors `useStockQueryNav`,
 * including the `startTransition`/`scroll: false` seamless-update behavior.
 */
export function useRemovalQueryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigateRemoval(updates: Partial<RemovalQueryState>) {
    const href = `${pathname}${removalSearchHref(searchParams, updates)}`;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return { navigateRemoval, isPending };
}
