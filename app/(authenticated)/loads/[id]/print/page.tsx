import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { PrintButton } from "@/components/loads/print-button";
import { buttonVariants } from "@/components/ui/button";
import { getLoadWithItems } from "@/lib/db/loads";
import { formatLoadSummary, isValidLoadId } from "@/lib/loads/print";
import { buildTrail } from "@/lib/nav/breadcrumbs";
import { getLoadItemQrCodes } from "@/lib/qrcode/generate";

export const dynamic = "force-dynamic";

export default async function LoadPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidLoadId(id)) {
    notFound();
  }

  const qrCodes = await getLoadItemQrCodes(id);

  if (qrCodes.length === 0) {
    notFound();
  }

  const { load } = await getLoadWithItems(id);
  const summary = formatLoadSummary(load);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="print:hidden">
        <Breadcrumbs
          items={buildTrail(
            { href: "/inventory", label: "Estoque" },
            { href: `/loads/${id}/print`, label: "Imprimir QR Codes" },
          )}
        />
      </div>
      <div className="flex flex-col gap-4 print:hidden">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Nota Fiscal</dt>
            <dd className="font-medium">{summary.notaFiscal}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Material</dt>
            <dd className="font-medium">{summary.material}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data de Entrada</dt>
            <dd className="font-medium">{summary.entryDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Quantidade de Itens</dt>
            <dd className="font-medium">{summary.itemCount}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link href="/inventory" className={buttonVariants({ variant: "outline" })}>
            Voltar ao Estoque
          </Link>
          <Link href="/loads/new" className={buttonVariants({ variant: "outline" })}>
            Adicionar outra carga
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 print:grid-cols-3 print:gap-4">
        {qrCodes.map((qr) => (
          <div
            key={qr.itemId}
            className="flex flex-col items-center gap-2 break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr.dataUrl}
              alt={qr.payload.identifier}
              className="w-full max-w-48"
            />
            <span className="text-center text-sm font-medium">
              {qr.payload.identifier}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
