"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchRemovalItems } from "@/lib/actions/removal-items";
import type { RemovalItemDetail } from "@/lib/db/removal-items";
import { formatWeightKg } from "@/lib/format/weight";
import type { RemovalLogRow } from "./removal-log-table";

export function RemovalDetailModal({
  removal,
  open,
  onOpenChange,
}: {
  removal: RemovalLogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<RemovalItemDetail[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !removal) {
      return;
    }

    const removalId = removal.id;
    startTransition(async () => {
      const result = await fetchRemovalItems(removalId);
      setItems(result.success ? result.items : []);
    });
  }, [open, removal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] px-[26px] py-6 shadow-2xl sm:max-w-[520px]">
        {removal && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[19px] font-bold">
                Remoção de {removal.exitDate}
              </DialogTitle>
            </DialogHeader>

            <dl className="grid grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Data de Saída
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {removal.exitDate}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Motorista</dt>
                <dd className="text-[15px] font-bold">{removal.driver}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Peso Total Removido
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeightKg(removal.totalRemovedWeight)}
                </dd>
              </div>
            </dl>

            <div className="overflow-hidden rounded-[14px] border border-border">
              {isPending ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : items.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum item encontrado para esta remoção.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_110px_110px] items-center gap-2.5 px-[18px] py-3.5 text-[13.5px]"
                    >
                      <span className="font-semibold">
                        Item {index + 1} — {item.notaFiscal}
                      </span>
                      <span className="text-right font-mono text-muted-foreground">
                        {item.notaFiscal}
                      </span>
                      <span className="text-right font-mono font-semibold">
                        {formatWeightKg(item.weight)}
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
