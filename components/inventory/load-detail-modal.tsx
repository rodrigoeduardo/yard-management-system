"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchLoadItems } from "@/lib/actions/load-items";
import type { LoadItemDetail } from "@/lib/db/load-items";
import { formatWeightKg } from "@/lib/format/weight";
import { formatItemStatus } from "@/lib/inventory/item-status";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-table";

export function LoadDetailModal({
  load,
  open,
  onOpenChange,
}: {
  load: StockRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<LoadItemDetail[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !load) {
      return;
    }

    const loadId = load.id;
    startTransition(async () => {
      const result = await fetchLoadItems(loadId);
      setItems(result.success ? result.items : []);
    });
  }, [open, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] px-[26px] py-6 shadow-2xl sm:max-w-[600px]">
        {load && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[19px] font-bold">
                Carga {load.notaFiscal}
              </DialogTitle>
              <DialogDescription
                render={<Link href={`/loads/${load.id}/print`} />}
                className="text-[13px] font-semibold text-accent-foreground no-underline"
              >
                Imprimir QR Codes
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">NF</dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.notaFiscal}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Material</dt>
                <dd className="text-[15px] font-bold">{load.material}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Data de Entrada
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.entryDate}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Peso da NF</dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeightKg(load.nfWeight)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Quantidade de Itens
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.itemCount}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Peso Restante
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeightKg(load.remainingWeight)}
                </dd>
              </div>
            </dl>

            <div className="max-h-64 overflow-y-auto rounded-[14px] border border-border">
              {isPending ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : items.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum item encontrado para esta carga.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_110px_110px] items-center gap-2.5 px-[18px] py-3.5 text-[13.5px]"
                    >
                      <span className="font-semibold">
                        Item {index + 1} — {load.material}
                      </span>
                      <span className="text-right font-mono">
                        {formatWeightKg(item.weight)}
                      </span>
                      <span
                        className={cn(
                          "text-right text-xs font-semibold",
                          item.status === "in_stock"
                            ? "text-success-foreground"
                            : "text-destructive",
                        )}
                      >
                        {formatItemStatus(item.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
