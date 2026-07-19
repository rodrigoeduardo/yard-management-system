import { InventoryView } from "@/components/inventory/inventory-view";
import type { RemovalLogRow } from "@/components/inventory/removal-log-table";
import type { StockRow } from "@/components/inventory/stock-table";
import { listStockPage } from "@/lib/db/loads";
import { listRemovalNfs, listRemovalsMostRecentFirst } from "@/lib/db/removal-log";
import { formatEntryDateTime } from "@/lib/format/datetime";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { isLoadFinished } from "@/lib/inventory/stock";
import { parseStockSearchParams } from "@/lib/inventory/stock-query";

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

  const [removalList, nfRows] = await Promise.all([
    listRemovalsMostRecentFirst(),
    listRemovalNfs(),
  ]);
  const nfsByRemoval = groupNfsByRemoval(nfRows);
  const itemCountByRemoval = new Map<string, number>();
  for (const { removalId } of nfRows) {
    itemCountByRemoval.set(
      removalId,
      (itemCountByRemoval.get(removalId) ?? 0) + 1,
    );
  }

  const removalRows: RemovalLogRow[] = removalList.map((removal) => ({
    id: removal.id,
    exitDate: formatEntryDateTime(removal.exitDate),
    driver: removal.driver,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
    itemCount: itemCountByRemoval.get(removal.id) ?? 0,
  }));

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-semibold">Estoque</h1>
      <InventoryView
        stockRows={stockRows}
        stockTotal={stockPage.total}
        stockQuery={stockQuery}
        removalRows={removalRows}
      />
    </main>
  );
}
