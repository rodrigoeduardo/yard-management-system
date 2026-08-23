"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchLoadItems } from "@/lib/actions/load-items";
import { updateItemWeightAction } from "@/lib/actions/item-weight";
import type { LoadItemDetail } from "@/lib/db/load-items";
import { formatWeight } from "@/lib/format/weight";
import { formatItemStatus } from "@/lib/inventory/item-status";
import { cn } from "@/lib/utils";
import type { StockRow } from "./stock-table";

export function LoadDetailModal({
  load,
  open,
  onOpenChange,
  itemWeightEditEnabled = false,
}: {
  load: StockRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server-computed FEATURE_ITEM_WEIGHT_EDIT; never read process.env in this client component. */
  itemWeightEditEnabled?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<LoadItemDetail[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedWeight, setEditedWeight] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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

  const startEditing = (item: LoadItemDetail) => {
    setEditingItemId(item.id);
    setEditedWeight(item.weight);
    setEditError(null);
  };

  const saveWeight = (item: LoadItemDetail) => {
    const weight = Number(editedWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      setEditError("Informe um peso maior que zero.");
      return;
    }

    startTransition(async () => {
      const result = await updateItemWeightAction({ itemId: item.id, weight });
      if (!result.success) {
        setEditError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível salvar o peso.",
        );
        return;
      }

      if (!load) return;
      const itemsResult = await fetchLoadItems(load.id);
      setItems(itemsResult.success ? itemsResult.items : []);
      setEditingItemId(null);
      setEditError(null);
      router.refresh();
    });
  };

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
                  Ordem de Transporte
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.transportOrder}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Motorista</dt>
                <dd className="text-[15px] font-bold">{load.driver}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Data da Nota Fiscal
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.nfDate}
                </dd>
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
                  {formatWeight(load.nfWeight)}
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
                  {formatWeight(load.remainingWeight)}
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
                  {items.map((item) => (
                    <li key={item.id} className="px-[18px] py-3.5 text-[13.5px]">
                      <div className="grid grid-cols-[1fr_110px_110px] items-center gap-2.5">
                      <span className="font-semibold">
                        Item {item.number} — {load.material}
                        {item.corrida ? (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {item.corrida}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-right font-mono">
                        {formatWeight(item.weight)}
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
                      </div>
                      {itemWeightEditEnabled && item.status === "in_stock" ? (
                        editingItemId === item.id ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <label className="sr-only" htmlFor={`item-weight-${item.id}`}>
                              Peso do item {item.number}
                            </label>
                            <input
                              id={`item-weight-${item.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={editedWeight}
                              onChange={(event) => setEditedWeight(event.target.value)}
                              className="h-8 w-28 rounded-md border border-input bg-background px-2 font-mono text-sm"
                            />
                            <Button type="button" size="sm" onClick={() => saveWeight(item)} disabled={isPending}>
                              Salvar peso
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditError(null);
                              }}
                              disabled={isPending}
                            >
                              Cancelar
                            </Button>
                            {editError ? <p className="w-full text-sm text-destructive">{editError}</p> : null}
                          </div>
                        ) : (
                          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => startEditing(item)}>
                            Editar peso
                          </Button>
                        )
                      ) : null}
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
