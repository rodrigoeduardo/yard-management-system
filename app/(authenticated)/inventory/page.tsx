import { InventoryView } from "@/components/inventory/inventory-view";
import type { RemovalLogRow } from "@/components/inventory/removal-log-table";
import type { StockRow } from "@/components/inventory/stock-table";
import { listStockPage } from "@/lib/db/loads";
import { listRemovalNfs, listRemovalsPage } from "@/lib/db/removal-log";
import { formatEntryDateTime } from "@/lib/format/datetime";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { parseRemovalSearchParams } from "@/lib/inventory/removal-query";
import { isLoadFinished } from "@/lib/inventory/stock";
import { parseStockSearchParams } from "@/lib/inventory/stock-query";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "@/lib/ui/page-container";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const stockQuery = parseStockSearchParams(resolvedSearchParams);
  const stockPage = await listStockPage(stockQuery);

  const stockRows: StockRow[] = stockPage.rows.map((load) => ({
    id: load.id,
    notaFiscal: load.notaFiscal,
    entryDate: formatEntryDateTime(load.entryDate),
    nfWeight: load.nfWeight,
    material: load.material,
    itemCount: load.itemCount,
    remainingWeight: load.remainingWeight,
    finished: isLoadFinished(load),
  }));

  const removalQuery = parseRemovalSearchParams(resolvedSearchParams);
  const removalPage = await listRemovalsPage(removalQuery);

  const nfRows = await listRemovalNfs(removalPage.rows.map((r) => r.id));
  const nfsByRemoval = groupNfsByRemoval(nfRows);

  const removalRows: RemovalLogRow[] = removalPage.rows.map((removal) => ({
    id: removal.id,
    exitDate: formatEntryDateTime(removal.exitDate),
    driver: removal.driver,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
    itemCount: removal.itemCount,
  }));

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:py-8",
        PAGE_CONTAINER_DESKTOP_CLASS,
      )}
    >
      <h1 className="text-2xl font-semibold">Estoque</h1>
      <InventoryView
        stockRows={stockRows}
        stockTotal={stockPage.total}
        stockQuery={stockQuery}
        removalRows={removalRows}
        removalTotal={removalPage.total}
        removalQuery={removalQuery}
      />
    </main>
  );
}
