import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/loads/print-button";
import type { LoadSummary } from "@/lib/loads/print";
import type { LoadItemQrCode } from "@/lib/qrcode/generate";

interface QrPrintViewProps {
  summary: LoadSummary;
  qrCodes: LoadItemQrCode[];
}

/**
 * Presentational view for the batch QR print page: success banner, NF/material
 * chip, and action buttons are screen-only; the QR card grid stays on screen
 * and print, laid out on a single page in print via `print:grid-cols-3`.
 */
export function QrPrintView({ summary, qrCodes }: QrPrintViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex items-center gap-2 rounded-card border border-success bg-success px-4 py-3 text-success-foreground">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-sm font-medium">
            Carga registrada no estoque
          </span>
        </div>

        <Badge className="w-fit items-center gap-1.5 border border-border bg-card px-3 py-1.5 text-sm text-foreground">
          <span className="font-mono">{summary.notaFiscal}</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span>{summary.material}</span>
        </Badge>

        <div className="flex flex-wrap items-center gap-2">
          <PrintButton>
            Imprimir {summary.itemCount} etiquetas em 1 folha
          </PrintButton>
          <Link
            href="/inventory"
            className={buttonVariants({ variant: "outline" })}
          >
            Voltar ao estoque
          </Link>
          <Link
            href="/loads/new"
            className={buttonVariants({ variant: "outline" })}
          >
            Adicionar outra carga
          </Link>
        </div>
      </div>

      <div
        data-testid="qr-grid"
        className="grid grid-cols-2 gap-4 md:grid-cols-4 print:grid-cols-3 print:gap-4"
      >
        {qrCodes.map((qr) => (
          <Card
            key={qr.itemId}
            className="flex flex-col items-center gap-2 break-inside-avoid p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.dataUrl}
              alt={qr.payload.identifier}
              className="w-full max-w-48"
            />
            <span className="text-center text-sm font-medium text-foreground">
              {qr.payload.identifier}
            </span>
            <span className="text-center text-xs text-muted-foreground">
              {qr.payload.material}
            </span>
            <span className="text-center font-mono text-xs text-foreground">
              {qr.payload.weight} kg
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
