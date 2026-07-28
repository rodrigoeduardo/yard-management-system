"use client";

import { Card } from "@/components/ui/card";
import { formatWeight } from "@/lib/format/weight";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-table";

function MetricField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10.5px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-mono text-[13.5px] font-semibold text-foreground",
          highlight && "font-bold text-destructive",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function StockCard({
  row,
  onClick,
}: {
  row: StockRow;
  onClick?: (row: StockRow) => void;
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
      className={cn(
        "flex flex-col gap-[11px] px-4 py-3.5",
        onClick && "cursor-pointer",
        row.finished && "border-destructive bg-destructive/15",
      )}
    >
      <div className="flex items-center gap-[10px]">
        <span className="font-mono text-[15px] font-bold text-foreground">
          NF {row.notaFiscal}
        </span>
        <span className="ml-auto text-[12px] text-muted-foreground">
          {row.entryDate}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <MetricField
          label="Peso da NF"
          value={formatWeight(row.nfWeight)}
          highlight={false}
        />
        <MetricField
          label="Qtd. de Itens"
          value={row.itemCount}
          highlight={row.finished}
        />
        <MetricField
          label="Peso Restante"
          value={formatWeight(row.remainingWeight)}
          highlight={row.finished}
        />
      </dl>

      <span
        className={cn(
          "text-[11px] text-muted-foreground",
          row.finished && "text-destructive",
        )}
      >
        Material: {row.material}
        {row.finished && " · estoque desta carga finalizado"}
      </span>
    </Card>
  );
}
