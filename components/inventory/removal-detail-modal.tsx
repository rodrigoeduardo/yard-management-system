"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelRemovalAction } from "@/lib/actions/removal-cancel";
import { fetchRemovalItems } from "@/lib/actions/removal-items";
import type { RemovalItemDetail } from "@/lib/db/removal-items";
import { formatWeight } from "@/lib/format/weight";
import type { RemovalLogRow } from "./removal-log-table";

export function RemovalDetailModal({
  removal,
  open,
  onOpenChange,
  removalCancelEnabled = false,
}: {
  removal: RemovalLogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Issue #310. Server-computed FEATURE_REMOVAL_CANCEL, passed down — never read process.env here. */
  removalCancelEnabled?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<RemovalItemDetail[]>([]);
  const [isPending, startTransition] = useTransition();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Reset the cancellation UI whenever a different removal (or a fresh
  // open) is shown — adjusted during render (React's recommended pattern
  // for state that must reset on a prop change), not inside the effect
  // below, so it can't trigger a synchronous setState-in-effect cascade.
  const resetKey = open ? (removal?.id ?? null) : null;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setConfirmingCancel(false);
    setJustCancelled(false);
    setCancelError(null);
  }

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

  const isCancelled = Boolean(removal?.cancelled) || justCancelled;

  const handleConfirmCancel = () => {
    if (!removal) {
      return;
    }
    startCancelTransition(async () => {
      const result = await cancelRemovalAction(removal.id);
      if (result.success) {
        setJustCancelled(true);
        setConfirmingCancel(false);
        router.refresh();
      } else {
        setCancelError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível cancelar a remoção.",
        );
      }
    });
  };

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
                      className="grid grid-cols-1 gap-2.5 px-[18px] py-3.5 text-[13.5px] md:grid-cols-[1fr_110px_110px] md:items-center"
                    >
                      <span className="font-semibold">{item.identifier}</span>
                      <div className="flex items-center justify-between md:block md:text-right">
                        <span className="text-xs text-muted-foreground md:hidden">
                          Material
                        </span>
                        <span className="text-muted-foreground">
                          {item.material}
                        </span>
                      </div>
                      <div className="flex items-center justify-between md:block md:text-right">
                        <span className="text-xs text-muted-foreground md:hidden">
                          Peso
                        </span>
                        <span className="font-mono font-semibold">
                          {formatWeight(item.weight)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                {removalCancelEnabled &&
                  (isCancelled ? (
                    <span className="w-fit rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] text-destructive">
                      Cancelada
                    </span>
                  ) : confirmingCancel ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        Confirma o cancelamento desta remoção? Os itens
                        voltarão para o estoque.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isCancelling}
                          onClick={handleConfirmCancel}
                        >
                          Confirmar cancelamento
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isCancelling}
                          onClick={() => setConfirmingCancel(false)}
                        >
                          Voltar
                        </Button>
                      </div>
                      {cancelError ? (
                        <p className="text-sm text-destructive">
                          {cancelError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => setConfirmingCancel(true)}
                    >
                      Cancelar remoção
                    </Button>
                  ))}
              </div>

              <Link
                href={`/removals/${removal.id}/receipt`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-fit gap-1.5",
                })}
              >
                <FileText className="size-4" aria-hidden="true" />
                Comprovante de Remoção
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
