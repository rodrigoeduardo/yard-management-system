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
import { formatItemStatus } from "@/lib/inventory/item-status";
import type { LoadItemDetail } from "@/lib/db/load-items";
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
      <DialogContent className="sm:max-w-lg">
        {load && (
          <>
            <DialogHeader>
              <DialogTitle>Carga {load.notaFiscal}</DialogTitle>
              <DialogDescription render={<Link href={`/loads/${load.id}/print`} />}>
                Imprimir QR Codes
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">NF</dt>
                <dd className="font-medium">{load.notaFiscal}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Material</dt>
                <dd className="font-medium">{load.material}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Data de Entrada</dt>
                <dd className="font-medium">{load.entryDate}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Peso da NF</dt>
                <dd className="font-medium">{load.nfWeight}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Quantidade de Itens</dt>
                <dd className="font-medium">{load.itemCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Peso Restante</dt>
                <dd className="font-medium">{load.remainingWeight}</dd>
              </div>
            </dl>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {isPending ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : items.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum item encontrado para esta carga.
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
                        {item.weight}
                      </span>
                      <span>{formatItemStatus(item.status)}</span>
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
