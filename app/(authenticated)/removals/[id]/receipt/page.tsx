import { notFound } from "next/navigation";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { PrintPageStyle } from "@/components/print/print-page-style";
import { RemovalPrintView } from "@/components/removals/removal-print-view";
import { getPedidoImageSignedUrl } from "@/lib/actions/pedido-image";
import { getRemovalReceiptItems } from "@/lib/db/removal-items";
import { getRemovalById } from "@/lib/db/removals";
import { formatRemovalReceiptSummary, isValidRemovalId } from "@/lib/removals/print";

export const dynamic = "force-dynamic";

// Removal receipt print output: A4 portrait with real margins, unlike the
// QR label route's 100x50mm thermal-label page (issue #286). Injected at
// runtime by PrintPageStyle rather than a route-scoped CSS Module — see
// that component's doc comment for why a CSS Module's stylesheet leaks
// across client-side navigation and can override the label route's rule
// (or vice versa) after the #286 follow-up.
const RECEIPT_PAGE_CSS = "@media print { @page { size: A4; margin: 15mm; } }";

export default async function RemovalReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidRemovalId(id)) {
    notFound();
  }

  const removal = await getRemovalById(id);
  if (!removal) {
    notFound();
  }

  const [items, pedidoImageUrl] = await Promise.all([
    getRemovalReceiptItems(id),
    getPedidoImageSignedUrl(removal.pedidoImagePath),
  ]);

  const summary = formatRemovalReceiptSummary(removal);

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8 print:min-h-0 print:p-0">
      <PrintPageStyle css={RECEIPT_PAGE_CSS} />
      <div className="print:hidden">
        <PageBackHeader title="Comprovante de Remoção" href="/inventory" />
      </div>
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl={pedidoImageUrl}
        items={items}
      />
    </main>
  );
}
