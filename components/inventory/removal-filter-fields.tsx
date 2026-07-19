"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RemovalQueryState } from "@/lib/inventory/removal-query";

export type RemovalFilterValues = {
  dateFrom: string;
  dateTo: string;
  weightMin: string;
  weightMax: string;
};

/**
 * The exit date range and total removed weight range filter inputs, shared
 * by the mobile modal and the desktop collapse panel (mirrors the
 * `RemovalOrderOptions`/`RemovalOrderControl` split). Edits are local
 * drafts — nothing navigates until "Aplicar filtros" is submitted, so
 * typing a partial date/number doesn't spam the URL. Mirrors
 * `StockFilterFields`.
 */
export function RemovalFilterFields({
  query,
  onApply,
  onClear,
}: {
  query: RemovalQueryState;
  onApply: (filters: RemovalFilterValues) => void;
  onClear: () => void;
}) {
  const [dateFrom, setDateFrom] = useState(query.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(query.dateTo ?? "");
  const [weightMin, setWeightMin] = useState(query.weightMin ?? "");
  const [weightMax, setWeightMax] = useState(query.weightMax ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({ dateFrom, dateTo, weightMin, weightMax });
  }

  function handleClear() {
    setDateFrom("");
    setDateTo("");
    setWeightMin("");
    setWeightMax("");
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Data de saída
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Data de saída - de"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Data de saída - até"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          Peso total removido
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="any"
            unit="kg"
            aria-label="Peso total removido - mínimo"
            value={weightMin}
            onChange={(event) => setWeightMin(event.target.value)}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="number"
            min="0"
            step="any"
            unit="kg"
            aria-label="Peso total removido - máximo"
            value={weightMax}
            onChange={(event) => setWeightMax(event.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClear}>
          Limpar filtros
        </Button>
        <Button type="submit">Aplicar filtros</Button>
      </div>
    </form>
  );
}
