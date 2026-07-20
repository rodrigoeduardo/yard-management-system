"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StockQueryState } from "@/lib/inventory/stock-query";
import { FilterRangeField } from "./filter-range-field";

export type StockFilterValues = {
  dateFrom: string;
  dateTo: string;
  weightMin: string;
  weightMax: string;
  showFinished: boolean;
};

/**
 * The entry date range, remaining weight range, and "show finished loads"
 * filter fields (design `2b`), shared by the mobile modal and the desktop
 * collapse panel. Edits are local drafts — nothing navigates until
 * "Aplicar" is submitted, so typing a partial date/number doesn't spam the
 * URL.
 */
export function StockFilterFields({
  query,
  onApply,
  onClear,
}: {
  query: StockQueryState;
  onApply: (filters: StockFilterValues) => void;
  onClear: () => void;
}) {
  const [dateFrom, setDateFrom] = useState(query.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(query.dateTo ?? "");
  const [weightMin, setWeightMin] = useState(query.weightMin ?? "");
  const [weightMax, setWeightMax] = useState(query.weightMax ?? "");
  const [showFinished, setShowFinished] = useState(query.showFinished ?? true);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({ dateFrom, dateTo, weightMin, weightMax, showFinished });
  }

  function handleClear() {
    setDateFrom("");
    setDateTo("");
    setWeightMin("");
    setWeightMax("");
    setShowFinished(true);
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FilterRangeField
        legend="Data de Entrada"
        type="date"
        valueFrom={dateFrom}
        valueTo={dateTo}
        onChangeFrom={setDateFrom}
        onChangeTo={setDateTo}
        ariaLabelFrom="Data de entrada - de"
        ariaLabelTo="Data de entrada - até"
      />

      <FilterRangeField
        legend="Peso Restante (kg)"
        type="number"
        valueFrom={weightMin}
        valueTo={weightMax}
        onChangeFrom={setWeightMin}
        onChangeTo={setWeightMax}
        ariaLabelFrom="Peso restante - mínimo"
        ariaLabelTo="Peso restante - máximo"
        placeholderFrom="Mín."
        placeholderTo="Máx."
      />

      <label
        htmlFor="stock-show-finished"
        className="flex cursor-pointer items-center gap-2.5 rounded-[10px] bg-muted px-3 py-2.5"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[19px] shrink-0 items-center justify-center rounded-[5px]",
            showFinished ? "bg-primary" : "border-2 border-border",
          )}
        >
          {showFinished && (
            <Check className="size-3 text-primary-foreground" strokeWidth={3.4} />
          )}
        </span>
        <input
          type="checkbox"
          id="stock-show-finished"
          checked={showFinished}
          onChange={(event) => setShowFinished(event.target.checked)}
          className="sr-only"
        />
        <span className="text-[13.5px] font-semibold text-foreground">
          Mostrar cargas finalizadas
        </span>
      </label>

      <div className="flex gap-2.5">
        <Button type="button" variant="outline" className="flex-1" onClick={handleClear}>
          Limpar
        </Button>
        <Button type="submit" className="flex-1">
          Aplicar
        </Button>
      </div>
    </form>
  );
}
