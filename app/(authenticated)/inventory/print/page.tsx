import {
  InventoryPrintView,
  type InventoryPrintRemovalRow,
  type InventoryPrintStockRow,
} from "@/components/inventory/inventory-print-view";
import { PageBackHeader } from "@/components/nav/page-back-header";
import { PrintPageStyle } from "@/components/print/print-page-style";
import { listStockPage } from "@/lib/db/loads";
import { listRemovalNfs, listRemovalsPage } from "@/lib/db/removal-log";
import { formatEntryDateTime } from "@/lib/format/datetime";
import {
  formatGeneratedAt,
  INVENTORY_PRINT_CAP,
  inventoryQueryString,
} from "@/lib/inventory/print";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { parseRemovalSearchParams } from "@/lib/inventory/removal-query";
import { parseStockSearchParams } from "@/lib/inventory/stock-query";

export const dynamic = "force-dynamic";

// Inventory overview print output: landscape A4, unlike the QR label
// route's 100x50mm thermal-label page or the removal receipt's A4
// portrait (issue #286, #270). Landscape is needed here because both
// tables have six columns each and would otherwise clip badly at A4
// portrait width — chosen and recorded per #309's technical notes.
// Injected at runtime by PrintPageStyle rather than a route-scoped CSS
// Module — see that component's doc comment for why a CSS Module's
// stylesheet leaks across client-side navigation.
const OVERVIEW_PAGE_CSS =
  "@media print { @page { size: A4 landscape; margin: 12mm; } }";

export default async function InventoryPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const backHref = `/inventory${inventoryQueryString(resolvedSearchParams)}`;

  const stockQuery = parseStockSearchParams(resolvedSearchParams);
  const removalQuery = parseRemovalSearchParams(resolvedSearchParams);

  const [stockPage, removalPage] = await Promise.all([
    listStockPage({
      ...stockQuery,
      page: 1,
      pageSize: INVENTORY_PRINT_CAP,
    }),
    listRemovalsPage({
      ...removalQuery,
      page: 1,
      pageSize: INVENTORY_PRINT_CAP,
    }),
  ]);

  const nfRows = await listRemovalNfs(removalPage.rows.map((r) => r.id));
  const nfsByRemoval = groupNfsByRemoval(nfRows);

  const stockRows: InventoryPrintStockRow[] = stockPage.rows.map((load) => ({
    id: load.id,
    notaFiscal: load.notaFiscal,
    entryDate: formatEntryDateTime(load.entryDate),
    nfWeight: load.nfWeight,
    material: load.material,
    itemCount: load.itemCount,
    remainingWeight: load.remainingWeight,
  }));

  const removalRows: InventoryPrintRemovalRow[] = removalPage.rows.map(
    (removal) => ({
      id: removal.id,
      exitDate: formatEntryDateTime(removal.exitDate),
      driver: removal.driver,
      vehiclePlate: removal.vehiclePlate ?? "—",
      notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
      itemCount: removal.itemCount,
      totalRemovedWeight: removal.totalRemovedWeight,
      cancelled: removal.cancelledAt !== null,
    }),
  );

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8 print:min-h-0 print:p-0">
      <PrintPageStyle css={OVERVIEW_PAGE_CSS} />
      <div className="print:hidden">
        <PageBackHeader title="Visão Geral do Estoque" href={backHref} />
      </div>
      <InventoryPrintView
        generatedAt={formatGeneratedAt(new Date())}
        backHref={backHref}
        stockRows={stockRows}
        stockTotal={stockPage.total}
        removalRows={removalRows}
        removalTotal={removalPage.total}
        cap={INVENTORY_PRINT_CAP}
      />
    </main>
  );
}
