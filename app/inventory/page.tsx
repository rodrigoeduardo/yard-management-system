import { desc } from "drizzle-orm";
import { StockTable, type StockRow } from "@/components/inventory/stock-table";
import { db } from "@/lib/db";
import { loads } from "@/lib/db/schema";
import { isLoadFinished } from "@/lib/inventory/stock";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.select().from(loads).orderBy(desc(loads.updatedAt));

  const rows: StockRow[] = stock.map((load) => ({
    id: load.id,
    notaFiscal: load.notaFiscal,
    entryDate: load.entryDate.toLocaleDateString("pt-BR"),
    nfWeight: load.nfWeight,
    material: load.material,
    itemCount: load.itemCount,
    remainingWeight: load.remainingWeight,
    finished: isLoadFinished(load),
  }));

  return (
    <main className="flex min-h-screen flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Estoque Atual</h1>
      <StockTable rows={rows} />
    </main>
  );
}
