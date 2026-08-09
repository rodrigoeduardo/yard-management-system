"use client";

import { Card } from "@/components/ui/card";
import { formatWeight } from "@/lib/format/weight";
import { cn } from "@/lib/utils";
import type { RemovalLogRow } from "./removal-log-table";

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
      className={cn("flex flex-col gap-2.5 px-4 py-3.5", onClick && "cursor-pointer")}
    >
      <div className="flex items-center gap-[10px]">
        <span className="font-mono text-[14px] font-bold text-foreground">
          {row.exitDate}
        </span>
        <span aria-hidden className="text-[13px] text-muted-foreground">
          ·
        </span>
        <span className="text-[13px] text-muted-foreground">{row.driver}</span>
        {row.cancelled ? (
          <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-destructive">
            Cancelada
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[14px] font-bold text-accent-foreground">
          {formatWeight(row.totalRemovedWeight)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        <span className="text-[10.5px] text-muted-foreground">Placa:</span>
        <span className="font-mono text-[11px] font-semibold text-foreground">
          {row.vehiclePlate}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        <span className="text-[10.5px] text-muted-foreground">
          Notas Fiscais:
        </span>
        <span className="rounded-md border border-border bg-muted px-[7px] py-[2px] font-mono text-[11px] font-semibold text-foreground">
          {row.notasFiscais}
        </span>
      </div>

      <div className="flex justify-between text-[11.5px] text-muted-foreground">
        <span>{row.itemCount} itens removidos</span>
        <span>Peso Total Removido</span>
      </div>
    </Card>
  );
}
