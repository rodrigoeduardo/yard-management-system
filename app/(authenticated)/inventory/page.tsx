import { desc } from "drizzle-orm";
import { InventoryView } from "@/components/inventory/inventory-view";
import type { RemovalLogRow } from "@/components/inventory/removal-log-table";
import type { StockRow } from "@/components/inventory/stock-table";
import { db } from "@/lib/db";
import { listRemovalNfs, listRemovalsMostRecentFirst } from "@/lib/db/removal-log";
import { loads } from "@/lib/db/schema";
import { groupNfsByRemoval } from "@/lib/inventory/removal-log";
import { isLoadFinished } from "@/lib/inventory/stock";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.select().from(loads).orderBy(desc(loads.updatedAt));

  const stockRows: StockRow[] = stock.map((load) => ({
    id: load.id,
    notaFiscal: load.notaFiscal,
    entryDate: load.entryDate.toLocaleDateString("pt-BR"),
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

  const removalRows: RemovalLogRow[] = removalList.map((removal) => ({
    id: removal.id,
    exitDate: removal.exitDate.toLocaleDateString("pt-BR"),
    driver: removal.driver,
    totalRemovedWeight: removal.totalRemovedWeight,
    notasFiscais: (nfsByRemoval.get(removal.id) ?? []).join(", "),
  }));

  return (
    <main className="flex min-h-screen flex-col gap-6 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-semibold">Estoque</h1>
      <InventoryView stockRows={stockRows} removalRows={removalRows} />
    </main>
  );
}
