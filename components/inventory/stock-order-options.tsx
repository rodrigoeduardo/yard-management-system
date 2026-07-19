"use client";

import { Button } from "@/components/ui/button";
import {
  STOCK_ORDER_OPTIONS,
  type StockOrderKey,
  type StockSortDir,
} from "@/lib/inventory/stock-query";

/**
 * The list of orderable columns, each with an ascending/descending choice.
 * Shared by the mobile modal and the desktop collapse panel so both stay
 * in lockstep.
 */
export function StockOrderOptions({
  order,
  dir,
  onSelect,
}: {
  order: StockOrderKey;
  dir: StockSortDir;
  onSelect: (order: StockOrderKey, dir: StockSortDir) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Ordenar estoque por</legend>
      {STOCK_ORDER_OPTIONS.map((option) => (
        <div
          key={option.key}
          className="flex items-center justify-between gap-3"
        >
          <span className="text-sm font-medium text-foreground">
            {option.label}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={
                order === option.key && dir === "asc" ? "default" : "outline"
              }
              aria-pressed={order === option.key && dir === "asc"}
              onClick={() => onSelect(option.key, "asc")}
            >
              Crescente
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                order === option.key && dir === "desc" ? "default" : "outline"
              }
              aria-pressed={order === option.key && dir === "desc"}
              onClick={() => onSelect(option.key, "desc")}
            >
              Decrescente
            </Button>
          </div>
        </div>
      ))}
    </fieldset>
  );
}
