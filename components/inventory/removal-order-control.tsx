"use client";

import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_REMOVAL_DIR,
  DEFAULT_REMOVAL_ORDER,
  type RemovalOrderKey,
  type RemovalSortDir,
} from "@/lib/inventory/removal-query";
import { ControlTriggerButton } from "./control-trigger-button";
import { RemovalOrderOptions } from "./removal-order-options";

/**
 * Order trigger for the removals section: a fixed-size icon button beside
 * the search bar that opens a modal at every breakpoint (mirrors
 * `RemovalFilterControl`) — replaces the old text-label trigger and the
 * desktop-only inline collapse panel. Mirrors `StockOrderControl`.
 */
export function RemovalOrderControl({
  order,
  dir,
  onChange,
}: {
  order: RemovalOrderKey;
  dir: RemovalSortDir;
  onChange: (order: RemovalOrderKey, dir: RemovalSortDir) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = order !== DEFAULT_REMOVAL_ORDER || dir !== DEFAULT_REMOVAL_DIR;

  function handleSelect(nextOrder: RemovalOrderKey, nextDir: RemovalSortDir) {
    onChange(nextOrder, nextDir);
  }

  function handleApply() {
    setOpen(false);
  }

  function handleClear() {
    onChange(DEFAULT_REMOVAL_ORDER, DEFAULT_REMOVAL_DIR);
    setOpen(false);
  }

  return (
    <>
      <ControlTriggerButton
        icon={ArrowUpDown}
        label="Ordenar"
        count={isActive ? 1 : undefined}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl px-[22px] py-5 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Ordenar por</DialogTitle>
          </DialogHeader>
          <RemovalOrderOptions
            order={order}
            dir={dir}
            onSelect={handleSelect}
            onApply={handleApply}
            onClear={handleClear}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
