import { notFound } from "next/navigation";
import { QrPrintView } from "@/components/loads/qr-print-view";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { getLoadWithItems } from "@/lib/db/loads";
import { formatLoadSummary, isValidLoadId } from "@/lib/loads/print";
import { getLoadItemQrCodes } from "@/lib/qrcode/generate";
import "./print.module.css";

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
        <PageBackHeader title="Imprimir QR Codes" href="/inventory" />
        <h1 className="hidden text-2xl font-semibold text-foreground md:block">
          Imprimir QR Codes
        </h1>
      </div>
      <QrPrintView summary={summary} qrCodes={qrCodes} />
    </main>
  );
}
