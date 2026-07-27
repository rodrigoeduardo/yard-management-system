import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/loads/print-button";
import type { RemovalReceiptItemDetail } from "@/lib/db/removal-items";
import { formatWeight } from "@/lib/format/weight";
import type { RemovalReceiptSummary } from "@/lib/removals/print";

interface RemovalPrintViewProps {
  summary: RemovalReceiptSummary;
  pedidoImageUrl: string | null;
  items: RemovalReceiptItemDetail[];
}

/**
 * Presentational view for the printable/shareable removal receipt
 * (business-rules.md#load-removal, issue #270): screen-only header/actions
 * (styled after `QrPrintView`) plus a print-friendly body — removal
 * summary, the attached Pedido reference image (from #269), and the
 * removed-items table.
 */
export function RemovalPrintView({
  summary,
  pedidoImageUrl,
  items,
}: RemovalPrintViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3.5 print:hidden">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">
            Comprovante de Remoção
          </h1>
        </div>
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
          Imprimir
        </PrintButton>
      </div>

      <dl className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Data de Saída</dt>
          <dd className="font-mono text-[15px] font-bold">
            {summary.exitDate}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Motorista</dt>
          <dd className="text-[15px] font-bold">{summary.driver}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Placa</dt>
          <dd className="font-mono text-[15px] font-bold">
            {summary.vehiclePlate}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">
            Peso Total Removido
          </dt>
          <dd className="font-mono text-[15px] font-bold">
            {summary.totalRemovedWeight}
          </dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-[14px] border border-border">
        <div className="border-b border-border bg-muted px-[18px] py-2.5 text-xs text-muted-foreground">
          Pedido
        </div>
        <div className="p-4">
          {pedidoImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pedidoImageUrl}
              alt="Pedido"
              className="max-h-[420px] w-full rounded-[10px] object-contain print:max-h-[240px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Imagem do Pedido indisponível.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border">
        <table className="w-full text-[13.5px]">
          <thead className="print:table-header-group">
            <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
              <th className="px-[18px] py-2.5 font-medium">Item</th>
              <th className="px-[18px] py-2.5 font-medium">NF</th>
              <th className="px-[18px] py-2.5 font-medium">Material</th>
              <th className="px-[18px] py-2.5 text-right font-medium">
                Peso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="print:break-inside-avoid">
                <td className="px-[18px] py-3 font-semibold">
                  {item.identifier}
                </td>
                <td className="px-[18px] py-3 font-mono text-muted-foreground">
                  {item.notaFiscal}
                </td>
                <td className="px-[18px] py-3 text-muted-foreground">
                  {item.material}
                </td>
                <td className="px-[18px] py-3 text-right font-mono font-semibold">
                  {formatWeight(item.weight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
