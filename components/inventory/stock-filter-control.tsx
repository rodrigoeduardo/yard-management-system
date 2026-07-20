"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
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
import { ControlTriggerButton } from "./control-trigger-button";
import { StockFilterFields, type StockFilterValues } from "./stock-filter-fields";

/**
 * Filter trigger for the stock section: a fixed-size icon button beside the
 * search bar that opens a modal at every breakpoint (mirrors
 * `StockOrderControl`) — replaces the old text-label trigger and the
 * desktop-only inline collapse panel. The trigger shows a badge overlay
 * with the number of active filters.
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
  const [open, setOpen] = useState(false);
  const activeCount = countActiveStockFilters(query);

  function handleApply(filters: StockFilterValues) {
    onApply(filters);
    setOpen(false);
  }

  function handleClear() {
    onClear();
    setOpen(false);
  }

  return (
    <>
      <ControlTriggerButton
        icon={SlidersHorizontal}
        label="Filtros"
        count={activeCount || undefined}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl px-[22px] py-5 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Filtros</DialogTitle>
          </DialogHeader>
          <StockFilterFields
            query={query}
            onApply={handleApply}
            onClear={handleClear}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
