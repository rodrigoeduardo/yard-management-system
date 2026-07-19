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
  DEFAULT_STOCK_DIR,
  DEFAULT_STOCK_ORDER,
  type StockOrderKey,
  type StockSortDir,
} from "@/lib/inventory/stock-query";
import { ControlTriggerButton } from "./control-trigger-button";
import { StockOrderOptions } from "./stock-order-options";

/**
 * Order trigger for the stock section: a fixed-size icon button beside the
 * search bar that opens a modal at every breakpoint (mirrors
 * `StockFilterControl`) — replaces the old text-label trigger and the
 * desktop-only inline collapse panel.
 */
export function StockOrderControl({
  order,
  dir,
  onChange,
}: {
  order: StockOrderKey;
  dir: StockSortDir;
  onChange: (order: StockOrderKey, dir: StockSortDir) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = order !== DEFAULT_STOCK_ORDER || dir !== DEFAULT_STOCK_DIR;

  function handleSelect(nextOrder: StockOrderKey, nextDir: StockSortDir) {
    onChange(nextOrder, nextDir);
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ordenar estoque</DialogTitle>
          </DialogHeader>
          <StockOrderOptions order={order} dir={dir} onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}
