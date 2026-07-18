import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { QrPrintView } from "@/components/loads/qr-print-view";
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
    <main className="flex min-h-screen flex-col gap-6 p-8 print:min-h-0 print:p-0">
      <div className="print:hidden">
        <Breadcrumbs
          items={buildTrail(
            { href: "/inventory", label: "Estoque" },
            { href: `/loads/${id}/print`, label: "Imprimir QR Codes" },
          )}
        />
      </div>
      <QrPrintView summary={summary} qrCodes={qrCodes} />
    </main>
  );
}
