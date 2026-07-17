"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Button } from "@/components/ui/button";
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
} from "@/lib/removals/scan-list";
import { checkItemStatus } from "@/lib/actions/item-status";
import { safeDecodeItemQrPayload, type ItemQrPayload } from "@/lib/qrcode/payload";

const inputClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
    });
  }

  function handleNewRemoval() {
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
  const reviewTotalWeight =
    scannedItems.length > 0
      ? sumDecimalStrings(scannedItems.map((item) => item.weight))
      : "0";

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-sm">
        <Breadcrumbs
          items={buildTrail({ href: "/removals/new", label: "Nova Remoção" })}
        />
      </div>
      <h1 className="text-2xl font-semibold">Nova Remoção</h1>

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
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="exitDate" className="text-sm font-medium">
              Data de Saída
            </label>
            <input
              id="exitDate"
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              required
              className={inputClassName}
            />
            {fieldErrors.exitDate && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.exitDate}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="driver" className="text-sm font-medium">
              Motorista
            </label>
            <input
              id="driver"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              required
              className={inputClassName}
            />
            {fieldErrors.driver && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.driver}
              </p>
            )}
          </div>

          <video ref={videoRef} className="w-full rounded-lg" muted />

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

          <ul className="flex flex-col gap-1.5 text-sm">
            {scannedItems.map((item) => (
              <li
                key={item.qrToken}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {item.identifier} — {item.material} — {item.weight} kg
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDropItem(item.qrToken)}
                  aria-label={`Remover ${item.identifier}`}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>

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

          <Button
            type="button"
            onClick={() => setIsReviewOpen(true)}
            disabled={isPending || scannedItems.length === 0}
          >
            Concluir Remoção
          </Button>
        </div>
      )}

      <Dialog.Root open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold">
              Revisar Remoção
            </Dialog.Title>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <p>
                <span className="font-medium">Data de Saída:</span>{" "}
                {exitDate}
              </p>
              <p>
                <span className="font-medium">Motorista:</span> {driver}
              </p>

              <div className="flex flex-col gap-2">
                {scannedItemsByNotaFiscal.map((group) => (
                  <div key={group.notaFiscal}>
                    <p className="font-medium">{group.notaFiscal}</p>
                    <ul className="flex flex-col gap-1 pl-3">
                      {group.items.map((item) => (
                        <li key={item.qrToken}>
                          {item.identifier} — {item.material} —{" "}
                          {item.weight} kg
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="font-medium">
                Peso Total: {reviewTotalWeight} kg
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={isPending}>
                Confirmar
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
