"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RemovalQueryState } from "@/lib/inventory/removal-query";
import { FilterRangeField } from "./filter-range-field";

export type RemovalFilterValues = {
  dateFrom: string;
  dateTo: string;
  weightMin: string;
  weightMax: string;
};

/**
 * The exit date range and total removed weight range filter fields (design
 * `2d`), shared by the mobile modal and the desktop collapse panel. Edits
 * are local drafts — nothing navigates until "Aplicar" is submitted, so
 * typing a partial date/number doesn't spam the URL. Mirrors
 * `StockFilterFields` (no checkbox row here — removals have no
 * "finalizada" state to toggle).
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
      <FilterRangeField
        legend="Data de Saída"
        type="date"
        valueFrom={dateFrom}
        valueTo={dateTo}
        onChangeFrom={setDateFrom}
        onChangeTo={setDateTo}
        ariaLabelFrom="Data de saída - de"
        ariaLabelTo="Data de saída - até"
      />

      <FilterRangeField
        legend="Peso Total Removido (kg)"
        type="number"
        valueFrom={weightMin}
        valueTo={weightMax}
        onChangeFrom={setWeightMin}
        onChangeTo={setWeightMax}
        ariaLabelFrom="Peso total removido - mínimo"
        ariaLabelTo="Peso total removido - máximo"
        placeholderFrom="Mín."
        placeholderTo="Máx."
      />

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
