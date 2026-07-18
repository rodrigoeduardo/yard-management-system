"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LoadDetailModal } from "./load-detail-modal";
import { StockCard } from "./stock-card";
import { StockTable, type StockRow } from "./stock-table";

export function StockSection({ rows }: { rows: StockRow[] }) {
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [open, setOpen] = useState(false);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Nenhuma carga em estoque.</p>
        <Link href="/loads/new" className={buttonVariants({ variant: "default" })}>
          Adicionar carga
        </Link>
      </div>
    );
  }

  const handleRowClick = (row: StockRow) => {
    setSelected(row);
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <StockCard key={row.id} row={row} onClick={handleRowClick} />
        ))}
      </div>
      <div className="hidden md:block">
        <StockTable rows={rows} onRowClick={handleRowClick} />
      </div>
      <LoadDetailModal load={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
