"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StockOrderKey, StockSortDir } from "@/lib/inventory/stock-query";
import { StockOrderOptions } from "./stock-order-options";

/**
 * Order panel trigger: a modal on mobile, an inline collapse/expand panel
 * on desktop (md:). Both render the same `StockOrderOptions` list so the
 * behavior stays identical across breakpoints — only the container differs.
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  function handleMobileSelect(nextOrder: StockOrderKey, nextDir: StockSortDir) {
    onChange(nextOrder, nextDir);
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
          Ordenar
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Ordenar estoque</DialogTitle>
            </DialogHeader>
            <StockOrderOptions
              order={order}
              dir={dir}
              onSelect={handleMobileSelect}
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
          Ordenar
        </Button>
        {desktopOpen && (
          <div className="mt-2 rounded-lg border bg-card p-3 shadow-sm">
            <StockOrderOptions order={order} dir={dir} onSelect={onChange} />
          </div>
        )}
      </div>
    </>
  );
}
