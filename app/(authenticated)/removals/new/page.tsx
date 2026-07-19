"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Scan, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { RemovalReceiptView } from "@/components/removals/removal-receipt-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { useTopLoaderTask } from "@/components/ui/top-loader";
import { removeItems } from "@/lib/actions/removals";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { formatEntryDateTime } from "@/lib/format/datetime";
import {
  type RemoveItemsFieldMessages,
  mapRemoveItemsFieldErrors,
} from "@/lib/forms/remove-items-error-map";
import {
  combineEntryDateTimeValue,
  getCurrentEntryDateTimeValue,
} from "@/lib/loads/entry-datetime";
import { buildRemovalReceipt, type RemovalReceipt } from "@/lib/removals/receipt";
import {
  addScannedItem,
  createScanCooldown,
  dropScannedItem,
  groupScannedItemsByNotaFiscal,
  notaFiscalOf,
} from "@/lib/removals/scan-list";
import { checkItemStatus } from "@/lib/actions/item-status";
import { safeDecodeItemQrPayload, type ItemQrPayload } from "@/lib/qrcode/payload";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "@/lib/ui/page-container";
import { cn } from "@/lib/utils";

function itemsLabel(count: number): string {
  return count === 1 ? "item" : "itens";
}

function notasFiscaisLabel(count: number): string {
  return count === 1 ? "nota fiscal" : "notas fiscais";
}

/** Ignore further QR reads for this long after an accepted scan (ms). */
const SCAN_COOLDOWN_MS = 2000;

export default function NewRemovalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useTopLoaderTask(isPending);
  const [exitDateTime, setExitDateTime] = useState(() =>
    getCurrentEntryDateTimeValue(),
  );
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
  const scanCooldownRef = useRef(createScanCooldown(SCAN_COOLDOWN_MS));

  async function handleScannedText(text: string) {
    const payload = safeDecodeItemQrPayload(text);
    if (!payload) {
      setScanError("Código QR inválido.");
      return;
    }

    if (scanCooldownRef.current.isActive(payload.qrToken)) {
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
    scanCooldownRef.current.start(payload.qrToken);
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

  function handleClearList() {
    scannedItemsRef.current = [];
    setScannedItems([]);
  }

  function handleConfirm() {
    setFieldErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = await removeItems({
        exitDateTime,
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
    setExitDateTime(getCurrentEntryDateTimeValue());
    setDriver("");
    setFieldErrors({});
    setFormError(undefined);
    setScanError(undefined);
    setReceipt(undefined);
  }

  function handleViewInventory() {
    router.push("/inventory");
  }

  const combinedExitDateTime = combineEntryDateTimeValue(exitDateTime);
  const scannedItemsByNotaFiscal = groupScannedItemsByNotaFiscal(scannedItems);
  const totalRemovedWeight =
    scannedItems.length > 0
      ? sumDecimalStrings(scannedItems.map((item) => item.weight))
      : "0";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 px-4 py-6 pb-44 md:pb-10",
        PAGE_CONTAINER_DESKTOP_CLASS,
      )}
    >
      {!receipt && (
        <>
          <PageBackHeader title="Nova Remoção" href="/" />
          <h1 className="hidden text-2xl font-semibold text-foreground md:block">
            Nova Remoção
          </h1>
        </>
      )}

      {receipt && (
        <RemovalReceiptView
          receipt={receipt}
          onNewRemoval={handleNewRemoval}
          onViewInventory={handleViewInventory}
        />
      )}

      {!receipt && (
        <div className="flex flex-col gap-5 md:grid md:grid-cols-[420px_1fr] md:items-start md:gap-5">
          {/* Left column: fixed removal data + scanner + toggle */}
          <div className="flex flex-col gap-5">
            <div className="flex w-full min-w-0 flex-col gap-4 md:rounded-card md:border md:border-border md:bg-card md:p-[22px]">
              <SectionLabel className="hidden font-bold text-foreground/80 md:block">
                Dados da Remoção
              </SectionLabel>

              <div className="flex w-full min-w-0 flex-col gap-1.5">
                <label
                  htmlFor="exitDateTime"
                  className="text-sm font-medium text-foreground"
                >
                  Data e hora de saída
                </label>
                <div className="w-full min-w-0 overflow-hidden rounded-input">
                  <Input
                    id="exitDateTime"
                    type="datetime-local"
                    mono
                    value={exitDateTime}
                    onChange={(e) => setExitDateTime(e.target.value)}
                    required
                    className="min-w-0"
                  />
                </div>
                {fieldErrors.exitDateTime && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.exitDateTime}
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

              <span className="hidden text-xs text-muted-foreground md:block">
                Fixos para todos os itens removidos nesta ação.
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative h-[210px] w-full overflow-hidden rounded-[18px] bg-foreground md:h-[280px]">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  muted
                />
                <div className="pointer-events-none absolute inset-4 md:inset-5">
                  <span className="absolute top-0 left-0 size-6 rounded-tl-md border-t-[3px] border-l-[3px] border-primary-foreground/90 md:size-7" />
                  <span className="absolute top-0 right-0 size-6 rounded-tr-md border-t-[3px] border-r-[3px] border-primary-foreground/90 md:size-7" />
                  <span className="absolute bottom-0 left-0 size-6 rounded-bl-md border-b-[3px] border-l-[3px] border-primary-foreground/90 md:size-7" />
                  <span className="absolute right-0 bottom-0 size-6 rounded-br-md border-r-[3px] border-b-[3px] border-primary-foreground/90 md:size-7" />
                  {isScanning && (
                    <div className="animate-scan-line absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_14px_var(--primary)]" />
                  )}
                  <span className="absolute right-0 bottom-1 left-0 text-center text-xs text-primary-foreground/65 md:text-[12.5px]">
                    Aponte a câmera para o QR Code do item
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={isScanning ? stopScanning : startScanning}
                className="flex h-[46px] items-center justify-center gap-2 rounded-input border-[1.5px] border-dashed border-accent-foreground/40 bg-accent/50 text-[13.5px] font-semibold text-accent-foreground"
              >
                <Scan className="size-4" />
                {isScanning ? "Parar Escaneamento" : "Iniciar Escaneamento"}
              </button>

              {scanError && (
                <p role="alert" className="text-sm text-destructive">
                  {scanError}
                </p>
              )}
            </div>
          </div>

          {/* Right column: scanned items list */}
          <div className="flex flex-col gap-3 md:gap-3.5 md:rounded-card md:border md:border-border md:bg-card md:p-[22px]">
            <div className="flex items-baseline justify-between">
              <SectionLabel className="font-bold text-foreground/80">
                ITENS LIDOS ({scannedItems.length})
              </SectionLabel>
              <span className="text-xs text-muted-foreground">
                {scannedItemsByNotaFiscal.length}{" "}
                {notasFiscaisLabel(scannedItemsByNotaFiscal.length)}
              </span>
            </div>

            {scannedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum item escaneado ainda.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {scannedItems.map((item, index) => (
                  <li key={item.qrToken}>
                    <Card className="flex items-center gap-3 rounded-[14px] px-3.5 py-3 md:bg-[oklch(0.985_0.002_250)]">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Item {index + 1}
                          </span>
                          <span className="rounded-[6px] bg-accent px-[7px] py-0.5 font-mono text-[11px] font-semibold text-accent-foreground">
                            {notaFiscalOf(item)}
                          </span>
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

            <div className="hidden items-center justify-center rounded-[13px] border-[1.5px] border-dashed border-border p-4 text-[12.5px] text-muted-foreground/80 md:flex">
              Os próximos itens lidos aparecem aqui
            </div>

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

            <div className="hidden items-center gap-5 border-t border-border pt-4 md:flex">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[11.5px] text-muted-foreground">
                  Peso Total Removido
                </span>
                <span className="font-mono text-xl font-bold text-foreground">
                  {totalRemovedWeight} kg
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClearList}
                disabled={scannedItems.length === 0}
                className="h-12 rounded-[13px] px-6"
              >
                Limpar lista
              </Button>
              <Button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                disabled={isPending || scannedItems.length === 0}
                className="h-12 rounded-[13px] px-6"
              >
                Concluir Remoção ({scannedItems.length}{" "}
                {itemsLabel(scannedItems.length)})
              </Button>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-16 z-30 flex flex-col gap-3 bg-gradient-to-t from-background from-35% to-transparent p-5 pt-7 md:hidden">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-[13px] font-semibold text-foreground/80">
                Peso Total Removido
              </span>
              <span className="font-mono text-lg font-bold text-foreground">
                {totalRemovedWeight} kg
              </span>
            </div>
            <Button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              disabled={isPending || scannedItems.length === 0}
              className="h-[52px] rounded-[14px] text-[15px]"
            >
              Concluir Remoção ({scannedItems.length}{" "}
              {itemsLabel(scannedItems.length)})
            </Button>
          </div>
        </div>
      )}

      <Dialog.Root open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/45 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Popup
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 rounded-t-[24px] border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:pb-5 md:data-open:zoom-in-95 md:data-open:slide-in-from-bottom-0 md:data-closed:zoom-out-95"
          >
            <div className="mx-auto h-[4.5px] w-10 shrink-0 rounded-pill bg-border md:hidden" />

            <Dialog.Title className="text-lg font-semibold text-foreground">
              Revisar Remoção
            </Dialog.Title>

            <div className="flex flex-col gap-4 overflow-y-auto text-sm">
              <dl className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-0.5 rounded-input bg-secondary px-3 py-2.5">
                  <dt className="text-[11px] text-muted-foreground">
                    Data de Saída
                  </dt>
                  <dd className="font-mono text-[13.5px] font-semibold text-foreground">
                    {combinedExitDateTime
                      ? formatEntryDateTime(combinedExitDateTime)
                      : exitDateTime}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 rounded-input bg-secondary px-3 py-2.5">
                  <dt className="text-[11px] text-muted-foreground">
                    Motorista
                  </dt>
                  <dd className="text-[13.5px] font-semibold text-foreground">
                    {driver}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3">
                {scannedItemsByNotaFiscal.map((group, groupIndex) => (
                  <div key={group.notaFiscal} className="flex flex-col gap-1.5">
                    {groupIndex > 0 && (
                      <div className="-mt-1.5 mb-1.5 h-px bg-border" />
                    )}
                    <span className="font-mono text-xs font-bold text-accent-foreground">
                      {group.notaFiscal} · {group.items[0]?.material}
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {group.items.map((item) => (
                        <li
                          key={item.qrToken}
                          className="flex items-center justify-between gap-2 px-0.5 text-[13.5px] text-foreground"
                        >
                          <span className="truncate">
                            {item.identifier} — {item.material}
                          </span>
                          <span className="shrink-0 font-mono font-medium text-muted-foreground">
                            {item.weight} kg
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-[14px] bg-accent px-4 py-3.5">
                <span className="text-[13.5px] font-semibold text-accent-foreground">
                  Peso Total Removido
                </span>
                <span className="font-mono text-lg font-bold text-accent-foreground">
                  {totalRemovedWeight} kg
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                disabled={isPending}
                className="h-[50px] flex-1 rounded-[14px]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="h-[50px] flex-1 rounded-[14px]"
              >
                {isPending ? "Removendo…" : "Confirmar"}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
