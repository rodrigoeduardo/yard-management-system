"use client";

import { Button } from "@/components/ui/button";
import {
  STOCK_ORDER_OPTIONS,
  type StockOrderKey,
  type StockSortDir,
} from "@/lib/inventory/stock-query";
import { OrderOptionRows } from "./order-option-rows";

/**
 * The list of orderable columns rendered as a radio list (design `2a`):
 * the selected field's row is highlighted with a filled radio dot and
 * shows inline Desc/Asc direction chips; unselected rows show an empty
 * radio ring only. Selecting a field or direction applies instantly via
 * `onSelect` (the modal stays open); the footer's `Aplicar`/`Limpar`
 * buttons close it via `onApply`/`onClear`. Shared by the mobile modal and
 * the desktop collapse panel.
 */
export function StockOrderOptions({
  order,
  dir,
  onSelect,
  onApply,
  onClear,
}: {
  order: StockOrderKey;
  dir: StockSortDir;
  onSelect: (order: StockOrderKey, dir: StockSortDir) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <OrderOptionRows
        legend="Ordenar estoque por"
        options={STOCK_ORDER_OPTIONS}
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
