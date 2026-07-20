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
  countActiveRemovalFilters,
  type RemovalQueryState,
} from "@/lib/inventory/removal-query";
import { ControlTriggerButton } from "./control-trigger-button";
import {
  RemovalFilterFields,
  type RemovalFilterValues,
} from "./removal-filter-fields";

/**
 * Filter trigger for the removals section: a fixed-size icon button beside
 * the search bar that opens a modal at every breakpoint (mirrors
 * `RemovalOrderControl`) — replaces the old text-label trigger and the
 * desktop-only inline collapse panel. Mirrors `StockFilterControl`. The
 * trigger shows a badge overlay with the number of active filters.
 */
export function RemovalFilterControl({
  query,
  onApply,
  onClear,
}: {
  query: RemovalQueryState;
  onApply: (filters: RemovalFilterValues) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveRemovalFilters(query);

  function handleApply(filters: RemovalFilterValues) {
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
          <RemovalFilterFields
            query={query}
            onApply={handleApply}
            onClear={handleClear}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
