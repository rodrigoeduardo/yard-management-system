"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  removalStatusLabel,
  type RemovalQueryState,
} from "@/lib/inventory/removal-query";
import {
  stockStatusLabel,
  type StockQueryState,
} from "@/lib/inventory/stock-query";
import { cn } from "@/lib/utils";
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
 * Mobile: a segmented control switches between the current-stock view and
 * the removal-history view, showing one section at a time.
 * Desktop (md:): the segmented control is hidden and both sections render
 * stacked, each with its own heading.
 */
export function InventoryView({
  stockRows,
  stockTotal,
  stockQuery,
  removalRows,
  removalTotal,
  removalQuery,
  removalCancelEnabled = false,
}: {
  stockRows: StockRow[];
  stockTotal: number;
  stockQuery: StockQueryState;
  removalRows: RemovalLogRow[];
  removalTotal: number;
  removalQuery: RemovalQueryState;
  removalCancelEnabled?: boolean;
}) {
  const [segment, setSegment] = useState<Segment>("current");

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <SegmentedControl
        items={SEGMENTS}
        value={segment}
        onChange={setSegment}
        aria-label="Selecionar visualização do estoque"
        className="md:hidden"
      />

      <div
        className={cn(
          "flex flex-col gap-3",
          segment !== "current" && "hidden md:flex",
        )}
      >
        <div className="hidden items-baseline gap-3 md:flex">
          <h2 className="text-xl font-bold text-foreground">Estoque Atual</h2>
          <span className="text-xs text-muted-foreground">
            {stockStatusLabel(stockQuery)}
          </span>
        </div>
        <StockSection rows={stockRows} total={stockTotal} query={stockQuery} />
      </div>

      <div
        className={cn(
          "flex flex-col gap-3",
          segment !== "removals" && "hidden md:flex",
        )}
      >
        <div className="hidden items-baseline gap-3 md:flex">
          <h2 className="text-xl font-bold text-foreground">
            Histórico de Remoções
          </h2>
          <span className="text-xs text-muted-foreground">
            {removalStatusLabel(removalQuery)}
          </span>
        </div>
        <RemovalSection
          rows={removalRows}
          total={removalTotal}
          query={removalQuery}
          removalCancelEnabled={removalCancelEnabled}
        />
      </div>
    </div>
  );
}
