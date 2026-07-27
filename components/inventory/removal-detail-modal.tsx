"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchRemovalItems } from "@/lib/actions/removal-items";
import type { RemovalItemDetail } from "@/lib/db/removal-items";
import { formatWeight } from "@/lib/format/weight";
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
      <DialogContent className="rounded-[20px] px-[26px] py-6 shadow-2xl sm:max-w-[600px]">
        {removal && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[19px] font-bold">
                Remoção de {removal.exitDate}
              </DialogTitle>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
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
                <dt className="text-xs text-muted-foreground">Placa</dt>
                <dd className="font-mono text-[15px] font-bold">
                  {removal.vehiclePlate}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Peso Total Removido
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeight(removal.totalRemovedWeight)}
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
                  Nenhum item encontrado para esta remoção.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_110px_110px] items-center gap-2.5 px-[18px] py-3.5 text-[13.5px]"
                    >
                      <span className="font-semibold">{item.identifier}</span>
                      <span className="text-right text-muted-foreground">
                        {item.material}
                      </span>
                      <span className="text-right font-mono font-semibold">
                        {formatWeight(item.weight)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              href={`/removals/${removal.id}/receipt`}
              className={buttonVariants({
                variant: "outline",
                className: "w-fit self-end gap-1.5",
              })}
            >
              <FileText className="size-4" aria-hidden="true" />
              Comprovante de Remoção
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
