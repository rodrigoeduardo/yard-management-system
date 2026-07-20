"use client";

import { useState } from "react";
import {
  REMOVAL_PAGE_SIZE,
  type RemovalQueryState,
} from "@/lib/inventory/removal-query";
import { cn } from "@/lib/utils";
import { RemovalCard } from "./removal-card";
import { RemovalDetailModal } from "./removal-detail-modal";
import { RemovalFilterControl } from "./removal-filter-control";
import { RemovalLogTable, type RemovalLogRow } from "./removal-log-table";
import { RemovalOrderControl } from "./removal-order-control";
import { RemovalPagination } from "./removal-pagination";
import { RemovalSearchInput } from "./removal-search-input";
import { useRemovalQueryNav } from "./use-removal-query-nav";

/**
 * Independent search bar, filter/order panel and pagination for the
 * removals section, mirroring `StockSection`'s pattern with `rem_*`
 * namespaced URL state — see `lib/inventory/removal-query.ts`.
 */
export function RemovalSection({
  rows,
  total,
  query,
}: {
  rows: RemovalLogRow[];
  total: number;
  query: RemovalQueryState;
}) {
  const [selected, setSelected] = useState<RemovalLogRow | null>(null);
  const [open, setOpen] = useState(false);
  const { navigateRemoval, isPending } = useRemovalQueryNav();

  const totalPages = Math.max(1, Math.ceil(total / REMOVAL_PAGE_SIZE));
  const isSearching = query.q.trim().length > 0;

  const handleRowClick = (row: RemovalLogRow) => {
    setSelected(row);
    setOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <RemovalSearchInput
          value={query.q}
          onSearch={(q) => navigateRemoval({ q })}
        />
        <RemovalOrderControl
          order={query.order}
          dir={query.dir}
          onChange={(order, dir) => navigateRemoval({ order, dir })}
        />
        <RemovalFilterControl
          query={query}
          onApply={(filters) => navigateRemoval(filters)}
          onClear={() =>
            navigateRemoval({
              dateFrom: "",
              dateTo: "",
              weightMin: "",
              weightMax: "",
            })
          }
        />
        {isPending ? (
          <span role="status" className="text-xs text-muted-foreground">
            Atualizando…
          </span>
        ) : null}
      </div>

      <div
        aria-busy={isPending}
        className={cn("transition-opacity", isPending && "opacity-60")}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              {isSearching
                ? "Nenhuma remoção encontrada para essa busca."
                : "Nenhuma remoção registrada ainda."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-[10px] md:hidden">
              <span className="text-[11.5px] text-muted-foreground">
                Ordenado por última modificação · somente visualização
              </span>
              {rows.map((row) => (
                <RemovalCard
                  key={row.id}
                  row={row}
                  onClick={handleRowClick}
                />
              ))}
            </div>
            <div className="hidden md:block">
              <RemovalLogTable rows={rows} onRowClick={handleRowClick} />
            </div>
          </>
        )}
      </div>

      <RemovalPagination
        page={query.page}
        totalPages={totalPages}
        onPageChange={(page) => navigateRemoval({ page })}
      />

      <RemovalDetailModal
        removal={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
