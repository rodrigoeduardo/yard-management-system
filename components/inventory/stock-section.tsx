"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  STOCK_PAGE_SIZE,
  stockStatusLabel,
  type StockQueryState,
} from "@/lib/inventory/stock-query";
import { cn } from "@/lib/utils";
import { LoadDetailModal } from "./load-detail-modal";
import { StockCard } from "./stock-card";
import { StockFilterControl } from "./stock-filter-control";
import { StockOrderControl } from "./stock-order-control";
import { StockPagination } from "./stock-pagination";
import { StockSearchInput } from "./stock-search-input";
import { StockTable, type StockRow } from "./stock-table";
import { useStockQueryNav } from "./use-stock-query-nav";

export function StockSection({
  rows,
  total,
  query,
}: {
  rows: StockRow[];
  total: number;
  query: StockQueryState;
}) {
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [open, setOpen] = useState(false);
  const { navigateStock, isPending } = useStockQueryNav();

  const totalPages = Math.max(1, Math.ceil(total / STOCK_PAGE_SIZE));
  const isSearching = query.q.trim().length > 0;

  const handleRowClick = (row: StockRow) => {
    setSelected(row);
    setOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <StockSearchInput
          value={query.q}
          onSearch={(q) => navigateStock({ q })}
        />
        <StockOrderControl
          order={query.order}
          dir={query.dir}
          onChange={(order, dir) => navigateStock({ order, dir })}
        />
        <StockFilterControl
          query={query}
          onApply={(filters) => navigateStock(filters)}
          onClear={() =>
            navigateStock({
              dateFrom: "",
              dateTo: "",
              weightMin: "",
              weightMax: "",
              showFinished: true,
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
            {isSearching ? (
              <p className="text-muted-foreground">
                Nenhuma carga encontrada para essa busca.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Nenhuma carga em estoque.
                </p>
                <Link
                  href="/loads/new"
                  className={buttonVariants({ variant: "default" })}
                >
                  Adicionar carga
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-[10px] md:hidden">
              <span className="text-[11.5px] text-muted-foreground">
                {stockStatusLabel(query)}
              </span>
              {rows.map((row) => (
                <StockCard key={row.id} row={row} onClick={handleRowClick} />
              ))}
            </div>
            <div className="hidden md:block">
              <StockTable rows={rows} onRowClick={handleRowClick} />
            </div>
          </>
        )}
      </div>

      <StockPagination
        page={query.page}
        totalPages={totalPages}
        onPageChange={(page) => navigateStock({ page })}
      />

      <LoadDetailModal load={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
