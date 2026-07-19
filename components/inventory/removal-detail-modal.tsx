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
      <DialogContent className="sm:max-w-lg">
        {removal && (
          <>
            <DialogHeader>
              <DialogTitle>Remoção de {removal.exitDate}</DialogTitle>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Data de Saída</dt>
                <dd className="font-medium">{removal.exitDate}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Motorista</dt>
                <dd className="font-medium">{removal.driver}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Peso Total Removido</dt>
                <dd className="font-medium">
                  {formatWeightKg(removal.totalRemovedWeight)}
                </dd>
              </div>
            </dl>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {isPending ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : items.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum item encontrado para esta remoção.
                </p>
              ) : (
                <ul className="divide-y">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3 text-sm"
                    >
                      <span>{item.identifier}</span>
                      <span className="text-muted-foreground">
                        {item.notaFiscal}
                      </span>
                      <span>{formatWeightKg(item.weight)}</span>
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
