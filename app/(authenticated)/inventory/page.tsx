import Link from "next/link";
import { InventoryView } from "@/components/inventory/inventory-view";
import type { RemovalLogRow } from "@/components/inventory/removal-log-table";
import type { StockRow } from "@/components/inventory/stock-table";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUserRole } from "@/lib/auth/current-role";
import { listStockPage } from "@/lib/db/loads";
import { listRemovalNfs, listRemovalsPage } from "@/lib/db/removal-log";
import { formatCalendarDate, formatEntryDateTime } from "@/lib/format/datetime";
import { inventoryQueryString } from "@/lib/inventory/print";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { parseRemovalSearchParams } from "@/lib/inventory/removal-query";
import { isLoadFinished } from "@/lib/inventory/stock";
import { parseStockSearchParams } from "@/lib/inventory/stock-query";
import { isRemovalCancelEnabled } from "@/lib/removals/feature-flags";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "@/lib/ui/page-container";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const showViewerRestrictedNotice =
    resolvedSearchParams.notice === "viewer-restricted";
  const stockQuery = parseStockSearchParams(resolvedSearchParams);
  const [stockPage, role] = await Promise.all([
    listStockPage(stockQuery),
    getCurrentUserRole(),
  ]);
  const isViewer = role === "viewer";

  const stockRows: StockRow[] = stockPage.rows.map((load) => ({
    id: load.id,
    notaFiscal: load.notaFiscal,
    transportOrder: load.transportOrder ?? "—",
    driver: load.driver ?? "—",
    nfDate: load.nfDate ? formatCalendarDate(load.nfDate) : "—",
    entryDate: formatEntryDateTime(load.entryDate),
    nfWeight: load.nfWeight,
    material: load.material,
    itemCount: load.itemCount,
    remainingWeight: load.remainingWeight,
    removedItemCount: load.removedItemCount,
    finished: isLoadFinished(load),
  }));

  const removalQuery = parseRemovalSearchParams(resolvedSearchParams);
  const removalPage = await listRemovalsPage(removalQuery);

  const printHref = `/inventory/print${inventoryQueryString(resolvedSearchParams)}`;

  const nfRows = await listRemovalNfs(removalPage.rows.map((r) => r.id));
  const nfsByRemoval = groupNfsByRemoval(nfRows);

  const removalRows: RemovalLogRow[] = removalPage.rows.map((removal) => ({
    id: removal.id,
    exitDate: formatEntryDateTime(removal.exitDate),
    driver: removal.driver,
    vehiclePlate: removal.vehiclePlate ?? "—",
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
    itemCount: removal.itemCount,
    cancelled: removal.cancelledAt !== null,
  }));

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:py-8",
        PAGE_CONTAINER_DESKTOP_CLASS,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Estoque</h1>
        <Link
          href={printHref}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "print:hidden",
          )}
        >
          Imprimir visão geral
        </Link>
      </div>
      {showViewerRestrictedNotice && (
        <p
          role="status"
          className="rounded-[12px] border border-border bg-accent px-4 py-3 text-sm font-medium text-accent-foreground"
        >
          Contas de visualização não podem cadastrar entradas ou saídas.
        </p>
      )}
      <InventoryView
        stockRows={stockRows}
        stockTotal={stockPage.total}
        stockQuery={stockQuery}
        removalRows={removalRows}
        removalTotal={removalPage.total}
        removalQuery={removalQuery}
        removalCancelEnabled={isRemovalCancelEnabled() && !isViewer}
      />
    </main>
  );
}
