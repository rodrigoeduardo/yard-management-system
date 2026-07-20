"use client";

import { Button } from "@/components/ui/button";
import {
  REMOVAL_ORDER_OPTIONS,
  type RemovalOrderKey,
  type RemovalSortDir,
} from "@/lib/inventory/removal-query";
import { OrderOptionRows } from "./order-option-rows";

/**
 * The list of orderable columns rendered as a radio list (design `2c`),
 * mirroring `StockOrderOptions`. Shared by the mobile modal and the
 * desktop collapse panel.
 */
export function RemovalOrderOptions({
  order,
  dir,
  onSelect,
  onApply,
  onClear,
}: {
  order: RemovalOrderKey;
  dir: RemovalSortDir;
  onSelect: (order: RemovalOrderKey, dir: RemovalSortDir) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <OrderOptionRows
        legend="Ordenar remoções por"
        options={REMOVAL_ORDER_OPTIONS}
        order={order}
        dir={dir}
        onSelect={onSelect}
      />
      <div className="flex gap-2.5">
        <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
          Limpar
        </Button>
        <Button type="button" className="flex-1" onClick={onApply}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}
