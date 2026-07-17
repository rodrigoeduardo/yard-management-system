"use client";

import { useState } from "react";
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

  return (
    <>
      <RemovalLogTable
        rows={rows}
        onRowClick={(row) => {
          setSelected(row);
          setOpen(true);
        }}
      />
      <RemovalDetailModal
        removal={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
