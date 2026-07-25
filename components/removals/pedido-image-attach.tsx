"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ImagePlus, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

interface PedidoImageAttachProps {
  file: File | null;
  onSelect: (file: File) => void;
  error?: string;
}

const PREVIEW_ALT = "Pré-visualização do Pedido";

/**
 * Attach-and-preview control for the customer's Pedido reference image
 * (business-rules.md#load-removal). Required, single image per removal —
 * the operator can replace it any time before submit. The preview is
 * zoomable via a dialog so a dense handwritten/printed order stays legible.
 */
export function PedidoImageAttach({
  file,
  onSelect,
  error,
}: PedidoImageAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

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

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) {
      onSelect(selected);
    }
    // Allow re-selecting the same file (e.g. after a failed upload retry).
    event.target.value = "";
  }

  return (
    <Card className="flex flex-col gap-3 p-4 md:rounded-card md:border md:border-border md:bg-card md:p-[22px]">
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
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="group relative block h-[160px] w-full overflow-hidden rounded-[14px] border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local File object preview, not a static/remote asset. */}
            <img
              src={previewUrl}
              alt={PREVIEW_ALT}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 hidden items-center justify-center bg-foreground/40 group-hover:flex">
              <ZoomIn className="size-6 text-primary-foreground" />
            </span>
          </button>

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
                className="max-h-full max-w-full rounded-[14px] object-contain"
              />
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}
