import { notFound } from "next/navigation";
import { QrPrintView } from "@/components/loads/qr-print-view";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { PrintPageStyle } from "@/components/print/print-page-style";
import { getLoadWithItems } from "@/lib/db/loads";
import { formatLoadSummary, isValidLoadId } from "@/lib/loads/print";
import { getLoadItemQrCodes } from "@/lib/qrcode/generate";

export const dynamic = "force-dynamic";

// QR label print output: one 100x50mm label per page (Elgin L42 Pro Full
// thermal printer). Injected at runtime by PrintPageStyle rather than a
// route-scoped CSS Module — see that component's doc comment for why a CSS
// Module's stylesheet leaks across client-side navigation (issue #95,
// adapted for label-roll printing in #217, scoped to this route in #286,
// scoping mechanism fixed to survive soft navigation in the #286 follow-up).
const LABEL_PAGE_CSS =
  "@media print { @page { size: 100mm 50mm; margin: 0; } }";

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
      <PrintPageStyle css={LABEL_PAGE_CSS} />
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
