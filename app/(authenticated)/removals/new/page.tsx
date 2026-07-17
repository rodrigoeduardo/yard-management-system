"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRef, useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Button } from "@/components/ui/button";
import { removeItems } from "@/lib/actions/removals";
import {
  type RemoveItemsFieldMessages,
  mapRemoveItemsFieldErrors,
} from "@/lib/forms/remove-items-error-map";
import { buildTrail } from "@/lib/nav/breadcrumbs";
import { addScannedItem } from "@/lib/removals/scan-list";
import { checkItemStatus } from "@/lib/actions/item-status";
import { safeDecodeItemQrPayload, type ItemQrPayload } from "@/lib/qrcode/payload";

const inputClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function NewRemovalPage() {
  const [isPending, startTransition] = useTransition();
  const [exitDate, setExitDate] = useState("");
  const [driver, setDriver] = useState("");
  const [scannedItems, setScannedItems] = useState<ItemQrPayload[]>([]);
  const [scanError, setScanError] = useState<string | undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RemoveItemsFieldMessages>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [totalRemovedWeight, setTotalRemovedWeight] = useState<
    string | undefined
  >();

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

  function handleSubmit() {
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
        return;
      }

      setTotalRemovedWeight(result.removal.totalRemovedWeight);
      scannedItemsRef.current = [];
      setScannedItems([]);
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-sm">
        <Breadcrumbs
          items={buildTrail({ href: "/removals/new", label: "Nova Remoção" })}
        />
      </div>
      <h1 className="text-2xl font-semibold">Nova Remoção</h1>

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
            <li key={item.qrToken}>
              {item.identifier} — {item.material} — {item.weight} kg
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

        {totalRemovedWeight && (
          <p className="text-sm font-medium">
            Peso Total Removido: {totalRemovedWeight} kg
          </p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || scannedItems.length === 0}
        >
          Concluir Remoção
        </Button>
      </div>
    </main>
  );
}
