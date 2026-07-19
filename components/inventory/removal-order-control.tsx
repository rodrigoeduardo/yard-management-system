"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  RemovalOrderKey,
  RemovalSortDir,
} from "@/lib/inventory/removal-query";
import { RemovalOrderOptions } from "./removal-order-options";

/**
 * Order panel trigger: a modal on mobile, an inline collapse/expand panel
 * on desktop (md:). Both render the same `RemovalOrderOptions` list so the
 * behavior stays identical across breakpoints — only the container differs.
 * Mirrors `StockOrderControl`.
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  function handleMobileSelect(
    nextOrder: RemovalOrderKey,
    nextDir: RemovalSortDir,
  ) {
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
              <DialogTitle>Ordenar remoções</DialogTitle>
            </DialogHeader>
            <RemovalOrderOptions
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
            <RemovalOrderOptions order={order} dir={dir} onSelect={onChange} />
          </div>
        )}
      </div>
    </>
  );
}
