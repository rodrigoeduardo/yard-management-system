"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ImagePlus, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

interface PedidoImageAttachProps {
  file: File | null;
  onSelect: (file: File) => void;
  error?: string;
}

const PREVIEW_ALT = "Pré-visualização do Pedido";
const MIN_PINCH_SCALE = 1;
const MAX_PINCH_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(a: React.Touch, b: React.Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchMidpoint(
  a: React.Touch,
  b: React.Touch,
): { x: number; y: number } {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

/**
 * Attach-and-preview control for the customer's Pedido reference image
 * (business-rules.md#load-removal). Required, single image per removal —
 * the operator can replace it any time before submit. The inline preview
 * supports pinch-to-zoom on touch devices; the "Ampliar" button is the only
 * way to open the full-screen zoom dialog, since a tap-to-open on the
 * preview itself would collide with the pinch gesture.
 */
export function PedidoImageAttach({
  file,
  onSelect,
  error,
}: PedidoImageAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [prevFile, setPrevFile] = useState(file);
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startMid: { x: number; y: number };
    startTranslate: { x: number; y: number };
  } | null>(null);

  // Derived directly from `file` (not effect + setState) — the object URL
  // only exists to synchronize with the browser's Blob URL registry, so its
  // lifecycle is handled by a cleanup-only effect below, never by pushing
  // it into React state.
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : undefined),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Reset zoom when the file changes, following React's "adjust state during
  // rendering" pattern instead of an effect (avoids an extra render pass).
  if (file !== prevFile) {
    setPrevFile(file);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) {
      onSelect(selected);
    }
    // Allow re-selecting the same file (e.g. after a failed upload retry).
    event.target.value = "";
  }

  function handlePreviewTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    pinchRef.current = {
      startDist: touchDistance(a, b),
      startScale: scale,
      startMid: touchMidpoint(a, b),
      startTranslate: translate,
    };
  }

  function handlePreviewTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const [a, b] = [event.touches[0], event.touches[1]];
    const dist = touchDistance(a, b);
    const mid = touchMidpoint(a, b);
    const { startDist, startScale, startMid, startTranslate } =
      pinchRef.current;
    const nextScale = clamp(
      startScale * (dist / startDist),
      MIN_PINCH_SCALE,
      MAX_PINCH_SCALE,
    );
    setScale(nextScale);
    setTranslate({
      x: startTranslate.x + (mid.x - startMid.x),
      y: startTranslate.y + (mid.y - startMid.y),
    });
  }

  function handlePreviewTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  }

  function handlePreviewTap() {
    // Pinched-in preview: tap resets it instead of doing nothing, since the
    // preview itself no longer opens the zoom dialog (that's "Ampliar"'s job).
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }

  return (
    <div className="flex flex-col gap-3 md:rounded-card md:border md:border-border md:bg-card md:p-[22px]">
      <SectionLabel className="font-bold text-foreground/80">
        Anexar Pedido
      </SectionLabel>

      <input
        ref={inputRef}
        data-testid="pedido-image-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {!file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-[110px] flex-col items-center justify-center gap-2 rounded-input border-[1.5px] border-dashed border-accent-foreground/40 bg-accent/50 text-[13.5px] font-semibold text-accent-foreground"
        >
          <ImagePlus className="size-5" />
          Anexar imagem do Pedido
        </button>
      )}

      {file && previewUrl && (
        <div className="flex flex-col gap-2.5">
          <div
            className="relative h-[260px] w-full touch-none overflow-hidden rounded-[14px] border border-border bg-muted"
            onTouchStart={handlePreviewTouchStart}
            onTouchMove={handlePreviewTouchMove}
            onTouchEnd={handlePreviewTouchEnd}
            onClick={handlePreviewTap}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local File object preview, not a static/remote asset. */}
            <img
              src={previewUrl}
              alt={PREVIEW_ALT}
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              }}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="h-10 flex-1 rounded-[11px] text-[13px]"
            >
              Trocar imagem
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label="Ampliar imagem"
              onClick={() => setIsZoomOpen(true)}
              className="h-10 flex-1 rounded-[11px] text-[13px]"
            >
              <ZoomIn className="size-4" />
              Ampliar
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Dialog.Root open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/70 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <Dialog.Popup
            onClick={() => setIsZoomOpen(false)}
            className={cn(
              "fixed inset-4 z-50 flex items-center justify-center outline-none md:inset-10",
            )}
          >
            <Dialog.Title className="sr-only">
              Imagem do Pedido ampliada
            </Dialog.Title>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- local File object preview, not a static/remote asset.
              <img
                src={previewUrl}
                alt={PREVIEW_ALT}
                onClick={(event) => event.stopPropagation()}
                className="max-h-full max-w-full rounded-[14px] object-contain"
              />
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
