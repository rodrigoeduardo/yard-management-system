import { notFound } from "next/navigation";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { RemovalPrintView } from "@/components/removals/removal-print-view";
import { getPedidoImageSignedUrl } from "@/lib/actions/pedido-image";
import { getRemovalReceiptItems } from "@/lib/db/removal-items";
import { getRemovalById } from "@/lib/db/removals";
import { formatRemovalReceiptSummary, isValidRemovalId } from "@/lib/removals/print";

export const dynamic = "force-dynamic";

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
