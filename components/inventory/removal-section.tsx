"use client";

import { useState } from "react";
import { RemovalCard } from "./removal-card";
import { RemovalDetailModal } from "./removal-detail-modal";
import { RemovalLogTable, type RemovalLogRow } from "./removal-log-table";

export function RemovalSection({ rows }: { rows: RemovalLogRow[] }) {
  const [selected, setSelected] = useState<RemovalLogRow | null>(null);
  const [open, setOpen] = useState(false);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Nenhuma remoção registrada ainda.
        </p>
      </div>
    );
  }

  const handleRowClick = (row: RemovalLogRow) => {
    setSelected(row);
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <RemovalCard key={row.id} row={row} onClick={handleRowClick} />
        ))}
      </div>
      <div className="hidden md:block">
        <RemovalLogTable rows={rows} onRowClick={handleRowClick} />
      </div>
      <RemovalDetailModal
        removal={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
