"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RemovalLogRow } from "./removal-log-table";

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

export function RemovalCard({
  row,
  onClick,
}: {
  row: RemovalLogRow;
  onClick?: (row: RemovalLogRow) => void;
}) {
  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(row) : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick(row);
              }
            }
          : undefined
      }
      className={cn("flex flex-col gap-3 p-4", onClick && "cursor-pointer")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{row.exitDate}</span>
        <span className="text-sm text-muted-foreground">{row.driver}</span>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Notas Fiscais</dt>
          <dd className="text-sm">{row.notasFiscais}</dd>
        </div>
        <Field label="Itens" value={row.itemCount} />
        <Field label="Peso Total Removido" value={row.totalRemovedWeight} />
      </dl>
    </Card>
  );
}
