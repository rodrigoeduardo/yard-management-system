import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/loads/print-button";
import { formatWeight } from "@/lib/format/weight";

export type InventoryPrintStockRow = {
  id: string;
  notaFiscal: string;
  entryDate: string;
  nfWeight: string;
  material: string;
  itemCount: number;
  remainingWeight: string;
};

export type InventoryPrintRemovalRow = {
  id: string;
  exitDate: string;
  driver: string;
  vehiclePlate: string;
  notasFiscais: string;
  itemCount: number;
  totalRemovedWeight: string;
  cancelled: boolean;
};

interface InventoryPrintViewProps {
  generatedAt: string;
  backHref: string;
  stockRows: InventoryPrintStockRow[];
  stockTotal: number;
  removalRows: InventoryPrintRemovalRow[];
  removalTotal: number;
  cap: number;
}

const HEADER_CLASS =
  "border-b border-border bg-muted px-[14px] py-2 text-left text-[10.5px] font-bold tracking-[0.04em] text-muted-foreground uppercase";

const CELL_CLASS = "px-[14px] py-2.5 text-[12.5px]";

/**
 * Presentational view for the inventory overview print route (issue #309):
 * screen-only header/actions (styled after `RemovalPrintView`) plus both
 * Estoque tables in full — Estoque Atual and Histórico de Remoções — for
 * whatever filtered set the caller resolved server-side. No pagination:
 * each table renders up to `cap` rows, with a truncation note when the
 * underlying total exceeds it.
 */
export function InventoryPrintView({
  generatedAt,
  backHref,
  stockRows,
  stockTotal,
  removalRows,
  removalTotal,
  cap,
}: InventoryPrintViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5 print:hidden">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-[22px] font-bold text-foreground">
            Visão Geral do Estoque
          </h1>
        </div>
        <Link
          href={backHref}
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

      <p className="text-xs text-muted-foreground">
        Gerado em {generatedAt}
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">Estoque Atual</h2>
        {stockRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma carga em estoque para os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border">
            <table className="w-full text-[13.5px]">
              <thead className="print:table-header-group">
                <tr>
                  <th className={HEADER_CLASS}>NF</th>
                  <th className={HEADER_CLASS}>Data de Entrada</th>
                  <th className={HEADER_CLASS}>Peso da NF</th>
                  <th className={HEADER_CLASS}>Material</th>
                  <th className={HEADER_CLASS}>Qtd. de Itens</th>
                  <th className={HEADER_CLASS}>Peso Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockRows.map((row) => (
                  <tr key={row.id} className="print:break-inside-avoid">
                    <td className={`${CELL_CLASS} font-mono font-bold`}>
                      {row.notaFiscal}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {row.entryDate}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {formatWeight(row.nfWeight)}
                    </td>
                    <td className={`${CELL_CLASS} font-semibold`}>
                      {row.material}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {row.itemCount}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {formatWeight(row.remainingWeight)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {stockTotal > cap ? (
          <p className="text-xs text-muted-foreground">
            Lista truncada: exibindo os primeiros {cap} de {stockTotal}{" "}
            registros.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-foreground">
          Histórico de Remoções
        </h2>
        {removalRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma remoção para os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border">
            <table className="w-full text-[13.5px]">
              <thead className="print:table-header-group">
                <tr>
                  <th className={HEADER_CLASS}>Data de Saída</th>
                  <th className={HEADER_CLASS}>Motorista</th>
                  <th className={HEADER_CLASS}>Placa</th>
                  <th className={HEADER_CLASS}>Notas Fiscais</th>
                  <th className={HEADER_CLASS}>Itens</th>
                  <th className={HEADER_CLASS}>Peso Total Removido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {removalRows.map((row) => (
                  <tr key={row.id} className="print:break-inside-avoid">
                    <td className={`${CELL_CLASS} font-mono font-bold`}>
                      {row.exitDate}
                      {row.cancelled ? (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.04em] text-destructive">
                          Cancelada
                        </span>
                      ) : null}
                    </td>
                    <td className={`${CELL_CLASS} font-semibold`}>
                      {row.driver}
                    </td>
                    <td className={`${CELL_CLASS} font-mono font-semibold`}>
                      {row.vehiclePlate}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {row.notasFiscais}
                    </td>
                    <td className={`${CELL_CLASS} font-mono`}>
                      {row.itemCount}
                    </td>
                    <td className={`${CELL_CLASS} font-mono font-bold`}>
                      {formatWeight(row.totalRemovedWeight)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {removalTotal > cap ? (
          <p className="text-xs text-muted-foreground">
            Lista truncada: exibindo os primeiros {cap} de {removalTotal}{" "}
            registros.
          </p>
        ) : null}
      </section>
    </div>
  );
}
