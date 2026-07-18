"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RemovalSection } from "./removal-section";
import type { RemovalLogRow } from "./removal-log-table";
import { StockSection } from "./stock-section";
import type { StockRow } from "./stock-table";

const SEGMENTS = [
  { value: "current", label: "Estoque Atual" },
  { value: "removals", label: "Remoções" },
] as const;

type Segment = (typeof SEGMENTS)[number]["value"];

/**
 * Segmented shell toggling between the current-stock view and the removal
 * history view.
 */
export function InventoryView({
  stockRows,
  removalRows,
}: {
  stockRows: StockRow[];
  removalRows: RemovalLogRow[];
}) {
  const [segment, setSegment] = useState<Segment>("current");

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        items={SEGMENTS}
        value={segment}
        onChange={setSegment}
        aria-label="Selecionar visualização do estoque"
      />
      {segment === "current" ? (
        <StockSection rows={stockRows} />
      ) : (
        <RemovalSection rows={removalRows} />
      )}
    </div>
  );
}
