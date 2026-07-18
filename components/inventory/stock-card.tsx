"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
          highlight && "font-bold text-success-foreground",
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
        row.finished && "border-success bg-success/15",
      )}
    >
      <div className="flex items-center gap-[10px]">
        <span className="font-mono text-[15px] font-bold text-foreground">
          NF {row.notaFiscal}
        </span>
        {row.finished ? (
          <Badge variant="success">Finalizada</Badge>
        ) : (
          <span className="rounded-md bg-accent px-2 py-[3px] text-[11.5px] font-semibold text-accent-foreground">
            {row.material}
          </span>
        )}
        <span className="ml-auto text-[12px] text-muted-foreground">
          {row.entryDate}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        <MetricField label="Peso da NF" value={row.nfWeight} highlight={false} />
        <MetricField
          label="Qtd. de Itens"
          value={row.itemCount}
          highlight={row.finished}
        />
        <MetricField
          label="Peso Restante"
          value={row.remainingWeight}
          highlight={row.finished}
        />
      </dl>

      {row.finished && (
        <span className="text-[11px] text-success-foreground">
          Material: {row.material} · estoque desta carga finalizado
        </span>
      )}
    </Card>
  );
}
