"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-table";

function Field({
  label,
  value,
  finished,
}: {
  label: string;
  value: string | number;
  finished: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-mono text-sm",
          finished && "text-success-foreground",
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
        "flex flex-col gap-3 p-4",
        onClick && "cursor-pointer",
        row.finished && "bg-success/15",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground">{row.notaFiscal}</span>
        {row.finished && <Badge variant="success">Finalizada</Badge>}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Field label="Data de Entrada" value={row.entryDate} finished={false} />
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Material</dt>
          <dd className="text-sm">{row.material}</dd>
        </div>
        <Field label="Peso da NF" value={row.nfWeight} finished={row.finished} />
        <Field
          label="Qtd. de Itens"
          value={row.itemCount}
          finished={row.finished}
        />
        <Field
          label="Peso Restante"
          value={row.remainingWeight}
          finished={row.finished}
        />
      </dl>
    </Card>
  );
}
