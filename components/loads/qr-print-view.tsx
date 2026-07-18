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
 * Presentational view for the batch QR print page: header, chip, and action
 * buttons are screen-only and render two layouts (mobile stack vs. desktop
 * header row, toggled by `hidden`/`md:flex`); the QR card grid stays on
 * screen and print, laid out on a single page in print via
 * `print:grid-cols-3`.
 */
export function QrPrintView({ summary, qrCodes }: QrPrintViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="hidden items-center gap-3.5 print:hidden md:flex">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">
            QR Codes da Carga
          </h1>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-mono font-bold text-accent-foreground">
              {summary.notaFiscal}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <span className="font-semibold text-foreground">
              {summary.material}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              ·
            </span>
            <span className="text-muted-foreground">
              Entrada {summary.entryDate} · {summary.itemCount} etiquetas
            </span>
          </div>
        </div>
        <span className="flex items-center gap-2 rounded-[11px] bg-success px-3.5 py-[9px] text-[12.5px] font-semibold text-success-foreground">
          <CheckCircle2 className="size-[15px]" />
          Carga registrada
        </span>
        <Link
          href="/inventory"
          className={buttonVariants({
            variant: "outline",
            className: "h-[46px] rounded-[12px] px-5 text-[13.5px]",
          })}
        >
          Voltar ao estoque
        </Link>
        <PrintButton className="h-[46px] rounded-[12px] px-[22px] text-[13.5px]">
          Imprimir em 1 folha
        </PrintButton>
      </div>

      <div className="flex flex-col gap-4 print:hidden md:hidden">
        <div className="flex items-center gap-2.5 rounded-[14px] border border-success bg-success px-3.5 py-3 text-success-foreground">
          <CheckCircle2 className="size-[18px] shrink-0" />
          <span className="text-[13px] font-semibold">
            Carga registrada no estoque
          </span>
        </div>

        <Badge className="w-fit items-center gap-1.5 rounded-[14px] border border-border bg-card px-3.5 py-3 text-[12.5px] text-foreground">
          <span className="font-mono font-bold text-accent-foreground">
            {summary.notaFiscal}
          </span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="font-semibold">{summary.material}</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <span className="text-muted-foreground">
            {summary.itemCount} etiquetas
          </span>
        </Badge>

        <div className="flex flex-col gap-2.5">
          <PrintButton className="h-[52px] rounded-[14px] text-[15px]">
            Imprimir {summary.itemCount} etiquetas em 1 folha
          </PrintButton>
          <Link
            href="/inventory"
            className={buttonVariants({
              variant: "outline",
              className: "h-12 rounded-[14px]",
            })}
          >
            Voltar ao estoque
          </Link>
        </div>
      </div>

      <div
        data-testid="qr-grid"
        className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 print:grid-cols-3 print:gap-4"
      >
        {qrCodes.map((qr) => (
          <Card
            key={qr.itemId}
            className="flex flex-col items-center gap-2 break-inside-avoid rounded-[16px] p-3 md:gap-[9px] md:p-3.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.dataUrl}
              alt={qr.payload.identifier}
              className="w-full max-w-48"
            />
            <span className="text-center text-[13px] font-bold text-foreground md:text-[13.5px]">
              {qr.payload.identifier}
            </span>
            <span className="text-center text-[11.5px] text-muted-foreground">
              {qr.payload.material}
            </span>
            <span className="text-center font-mono text-xs font-semibold text-accent-foreground md:text-[12.5px]">
              {qr.payload.weight} kg
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
