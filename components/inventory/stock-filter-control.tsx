"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  countActiveStockFilters,
  type StockQueryState,
} from "@/lib/inventory/stock-query";
import { StockFilterFields, type StockFilterValues } from "./stock-filter-fields";

/**
 * Filter panel trigger for the stock section: a modal on mobile, an inline
 * collapse/expand panel on desktop (md:) — mirrors `StockOrderControl`. The
 * trigger button shows a badge with the number of active filters.
 */
export function StockFilterControl({
  query,
  onApply,
  onClear,
}: {
  query: StockQueryState;
  onApply: (filters: StockFilterValues) => void;
  onClear: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const activeCount = countActiveStockFilters(query);
  const label = activeCount > 0 ? `Filtros (${activeCount})` : "Filtros";

  function handleMobileApply(filters: StockFilterValues) {
    onApply(filters);
    setMobileOpen(false);
  }

  function handleMobileClear() {
    onClear();
    setMobileOpen(false);
  }

  return (
    <>
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileOpen(true)}
        >
          {label}
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Filtrar estoque</DialogTitle>
            </DialogHeader>
            <StockFilterFields
              query={query}
              onApply={handleMobileApply}
              onClear={handleMobileClear}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden md:block">
        <Button
          type="button"
          variant="outline"
          aria-expanded={desktopOpen}
          onClick={() => setDesktopOpen((current) => !current)}
        >
          {label}
        </Button>
        {desktopOpen && (
          <div className="mt-2 rounded-lg border bg-card p-3 shadow-sm">
            <StockFilterFields query={query} onApply={onApply} onClear={onClear} />
          </div>
        )}
      </div>
    </>
  );
}
