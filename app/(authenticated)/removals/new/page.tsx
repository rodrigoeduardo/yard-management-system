"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { removeItems } from "@/lib/actions/removals";
import { sumDecimalStrings } from "@/lib/db/decimal";
import {
  type RemoveItemsFieldMessages,
  mapRemoveItemsFieldErrors,
} from "@/lib/forms/remove-items-error-map";
import { buildTrail } from "@/lib/nav/breadcrumbs";
import { buildRemovalReceipt, type RemovalReceipt } from "@/lib/removals/receipt";
import {
  addScannedItem,
  dropScannedItem,
  groupScannedItemsByNotaFiscal,
  notaFiscalOf,
} from "@/lib/removals/scan-list";
import { checkItemStatus } from "@/lib/actions/item-status";
import { safeDecodeItemQrPayload, type ItemQrPayload } from "@/lib/qrcode/payload";

function itemsLabel(count: number): string {
  return count === 1 ? "item" : "itens";
}

export default function NewRemovalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exitDate, setExitDate] = useState("");
  const [driver, setDriver] = useState("");
  const [scannedItems, setScannedItems] = useState<ItemQrPayload[]>([]);
  const [scanError, setScanError] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RemoveItemsFieldMessages>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [receipt, setReceipt] = useState<RemovalReceipt | undefined>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scannedItemsRef = useRef<ItemQrPayload[]>([]);
  const pendingTokensRef = useRef<Set<string>>(new Set());

  async function handleScannedText(text: string) {
    const payload = safeDecodeItemQrPayload(text);
    if (!payload) {
      setScanError("Código QR inválido.");
      return;
    }

    const { list, error } = addScannedItem(scannedItemsRef.current, payload);
    if (error) {
      setScanError(error);
      return;
    }

    if (pendingTokensRef.current.has(payload.qrToken)) {
      return;
    }
    pendingTokensRef.current.add(payload.qrToken);

    const status = await checkItemStatus(payload.qrToken);
    pendingTokensRef.current.delete(payload.qrToken);

    if (!status.success || status.status === "not_found") {
      setScanError("Item não encontrado.");
      return;
    }
    if (status.status === "removed") {
      setScanError("Este item já foi removido anteriormente.");
      return;
    }

    setScanError(undefined);
    scannedItemsRef.current = list;
    setScannedItems(list);
  }

  async function startScanning() {
    setIsScanning(true);
    const reader = new BrowserQRCodeReader();
    controlsRef.current = await reader.decodeFromVideoDevice(
      undefined,
      videoRef.current ?? undefined,
      (result) => {
        if (result) {
          void handleScannedText(result.getText());
        }
      },
    );
  }

  function stopScanning() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  }

  function handleDropItem(qrToken: string) {
    const list = dropScannedItem(scannedItemsRef.current, qrToken);
    scannedItemsRef.current = list;
    setScannedItems(list);
  }

  function handleConfirm() {
    setFieldErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = await removeItems({
        exitDate,
        driver,
        qrTokens: scannedItemsRef.current.map((item) => item.qrToken),
      });

      if (!result.success) {
        setFieldErrors(mapRemoveItemsFieldErrors(result.error.fieldErrors));
        if (result.error.formErrors.length > 0) {
          setFormError("Verifique os campos e tente novamente.");
        }
        setIsReviewOpen(false);
        return;
      }

      setReceipt(
        buildRemovalReceipt(
          scannedItemsRef.current,
          result.removal.totalRemovedWeight,
        ),
      );
      scannedItemsRef.current = [];
      setScannedItems([]);
      setIsReviewOpen(false);
      stopScanning();
    });
  }

  function handleNewRemoval() {
    stopScanning();
    setExitDate("");
    setDriver("");
    setFieldErrors({});
    setFormError(undefined);
    setScanError(undefined);
    setReceipt(undefined);
  }

  function handleViewInventory() {
    router.push("/inventory");
  }

  const scannedItemsByNotaFiscal = groupScannedItemsByNotaFiscal(scannedItems);
  const totalRemovedWeight =
    scannedItems.length > 0
      ? sumDecimalStrings(scannedItems.map((item) => item.weight))
      : "0";

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-44 md:mx-auto md:w-full md:max-w-4xl md:px-8 md:pb-28">
      <Breadcrumbs
        items={buildTrail({ href: "/removals/new", label: "Nova Remoção" })}
      />
      <h1 className="text-2xl font-semibold text-foreground">Nova Remoção</h1>

      {receipt && (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h2 className="text-lg font-semibold">Remoção Concluída</h2>

          <p className="text-sm">
            <span className="font-medium">Itens Removidos:</span>{" "}
            {receipt.itemCount}
          </p>

          <div className="flex flex-col gap-2 text-sm">
            {receipt.byNotaFiscal.map((group) => (
              <div key={group.notaFiscal}>
                <p className="font-medium">{group.notaFiscal}</p>
                <ul className="flex flex-col gap-1 pl-3">
                  {group.items.map((item) => (
                    <li key={item.qrToken}>
                      {item.identifier} — {item.material} — {item.weight} kg
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-sm font-medium">
            Peso Total Removido: {receipt.totalRemovedWeight} kg
          </p>

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={handleNewRemoval}>
              Nova Remoção
            </Button>
            <Button type="button" variant="outline" onClick={handleViewInventory}>
              Ver Estoque
            </Button>
          </div>
        </div>
      )}

      {!receipt && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-5 p-5">
            <SectionLabel>Dados da Remoção</SectionLabel>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="exitDate"
                className="text-sm font-medium text-foreground"
              >
                Data de Saída
              </label>
              <Input
                id="exitDate"
                type="date"
                mono
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                required
              />
              {fieldErrors.exitDate && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.exitDate}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="driver"
                className="text-sm font-medium text-foreground"
              >
                Motorista
              </label>
              <Input
                id="driver"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                placeholder="Nome do motorista"
                required
              />
              {fieldErrors.driver && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.driver}
                </p>
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-5">
            <SectionLabel>Escanear Itens</SectionLabel>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-input bg-foreground">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
              />
              <div className="pointer-events-none absolute inset-4">
                <span className="absolute top-0 left-0 size-6 rounded-tl-md border-t-2 border-l-2 border-primary-foreground/80" />
                <span className="absolute top-0 right-0 size-6 rounded-tr-md border-t-2 border-r-2 border-primary-foreground/80" />
                <span className="absolute bottom-0 left-0 size-6 rounded-bl-md border-b-2 border-l-2 border-primary-foreground/80" />
                <span className="absolute right-0 bottom-0 size-6 rounded-br-md border-r-2 border-b-2 border-primary-foreground/80" />
                {isScanning && (
                  <div className="animate-scan-line absolute inset-x-0 h-0.5 bg-primary-foreground/80" />
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? "Parar Escaneamento" : "Iniciar Escaneamento"}
            </Button>

            {scanError && (
              <p role="alert" className="text-sm text-destructive">
                {scanError}
              </p>
            )}
          </Card>

          <div className="flex flex-col gap-3">
            <SectionLabel>
              Itens Escaneados ({scannedItems.length})
            </SectionLabel>

            {scannedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum item escaneado ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {scannedItems.map((item, index) => (
                  <li key={item.qrToken}>
                    <Card className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Item {index + 1}
                          </span>
                          <Badge>{notaFiscalOf(item)}</Badge>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.material}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {item.weight} kg
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${item.identifier}`}
                          onClick={() => handleDropItem(item.qrToken)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}

            {fieldErrors.qrTokens && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.qrTokens}
              </p>
            )}

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card p-4 md:bottom-0">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 md:px-4">
              <div className="flex flex-col">
                <SectionLabel>Peso Total Removido</SectionLabel>
                <span className="font-mono text-lg font-semibold text-foreground">
                  {totalRemovedWeight} kg
                </span>
              </div>
              <Button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                disabled={isPending || scannedItems.length === 0}
                className="shrink-0"
              >
                Concluir Remoção ({scannedItems.length}{" "}
                {itemsLabel(scannedItems.length)})
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog.Root open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Popup
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 rounded-t-card border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:pb-5 md:data-open:zoom-in-95 md:data-open:slide-in-from-bottom-0 md:data-closed:zoom-out-95"
          >
            <div className="mx-auto h-1 w-10 shrink-0 rounded-pill bg-border md:hidden" />

            <Dialog.Title className="text-lg font-semibold text-foreground">
              Revisar Remoção
            </Dialog.Title>

            <div className="flex flex-col gap-4 overflow-y-auto text-sm">
              <dl className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Data de Saída
                  </dt>
                  <dd className="font-medium text-foreground">{exitDate}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Motorista
                  </dt>
                  <dd className="font-medium text-foreground">{driver}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3">
                {scannedItemsByNotaFiscal.map((group) => (
                  <div key={group.notaFiscal} className="flex flex-col gap-2">
                    <Badge>{group.notaFiscal}</Badge>
                    <ul className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <li
                          key={item.qrToken}
                          className="flex items-center justify-between gap-2 text-foreground"
                        >
                          <span className="truncate">
                            {item.identifier} — {item.material}
                          </span>
                          <span className="shrink-0 font-mono text-muted-foreground">
                            {item.weight} kg
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-input bg-accent p-3">
                <SectionLabel className="text-accent-foreground/80">
                  Peso Total Removido
                </SectionLabel>
                <span className="font-mono text-lg font-semibold text-accent-foreground">
                  {totalRemovedWeight} kg
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                disabled={isPending}
                className="w-full md:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full md:w-auto"
              >
                Confirmar
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
