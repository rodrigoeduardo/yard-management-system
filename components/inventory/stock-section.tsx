"use client";

import { useState } from "react";
import { LoadDetailModal } from "./load-detail-modal";
import { StockTable, type StockRow } from "./stock-table";

export function StockSection({ rows }: { rows: StockRow[] }) {
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <StockTable
        rows={rows}
        onRowClick={(row) => {
          setSelected(row);
          setOpen(true);
        }}
      />
      <LoadDetailModal load={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
