import { desc } from "drizzle-orm";
import { InventoryView } from "@/components/inventory/inventory-view";
import type { RemovalLogRow } from "@/components/inventory/removal-log-table";
import type { StockRow } from "@/components/inventory/stock-table";
import { db } from "@/lib/db";
import { listRemovalNfs, listRemovalsMostRecentFirst } from "@/lib/db/removal-log";
import { loads } from "@/lib/db/schema";
import { formatEntryDateTime } from "@/lib/format/datetime";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { isLoadFinished } from "@/lib/inventory/stock";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.select().from(loads).orderBy(desc(loads.updatedAt));

  const stockRows: StockRow[] = stock.map((load) => ({
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
    exitDate: removal.exitDate.toLocaleDateString("pt-BR"),
    driver: removal.driver,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
    itemCount: itemCountByRemoval.get(removal.id) ?? 0,
  }));

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-semibold">Estoque</h1>
      <InventoryView stockRows={stockRows} removalRows={removalRows} />
    </main>
  );
}
