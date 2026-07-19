"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockQueryState } from "@/lib/inventory/stock-query";

export type StockFilterValues = {
  dateFrom: string;
  dateTo: string;
  weightMin: string;
  weightMax: string;
  showFinished: boolean;
};

/**
 * The entry date range and remaining weight range filter inputs, shared by
 * the mobile modal and the desktop collapse panel (mirrors the
 * `StockOrderOptions`/`StockOrderControl` split). Edits are local drafts —
 * nothing navigates until "Aplicar filtros" is submitted, so typing a
 * partial date/number doesn't spam the URL.
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
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Data de entrada
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Data de entrada - de"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Data de entrada - até"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Peso restante
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="any"
            unit="kg"
            aria-label="Peso restante - mínimo"
            value={weightMin}
            onChange={(event) => setWeightMin(event.target.value)}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="number"
            min="0"
            step="any"
            unit="kg"
            aria-label="Peso restante - máximo"
            value={weightMax}
            onChange={(event) => setWeightMax(event.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="stock-show-finished"
          checked={showFinished}
          onChange={(event) => setShowFinished(event.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <label
          htmlFor="stock-show-finished"
          className="text-sm font-medium text-foreground"
        >
          Mostrar cargas finalizadas
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
        <Button type="submit">Aplicar filtros</Button>
      </div>
    </form>
  );
}
