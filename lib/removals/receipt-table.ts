import { sumDecimalStrings } from "@/lib/db/decimal";
import type { RemovalReceiptItemDetail } from "@/lib/db/removal-items";

export type RemovalReceiptTableRow = {
  notaFiscal: string;
  material: string;
  itemCount: number;
  totalWeight: string;
};

/**
 * Groups a removal's items by (Nota Fiscal, Material) for the printable
 * receipt table (business-rules.md#load-removal, issue #308) — one row per
 * pair instead of one row per item, first-seen order preserved. Each row's
 * `totalWeight` is the decimal-string sum of that group's item weights, so
 * summing every row's weight reproduces the removal's total removed weight
 * exactly.
 */
export function groupRemovalItemsForReceiptTable(
  items: RemovalReceiptItemDetail[],
): RemovalReceiptTableRow[] {
  const rows: (RemovalReceiptTableRow & { weights: string[] })[] = [];
  const index = new Map<string, (typeof rows)[number]>();

  for (const item of items) {
    const key = `${item.notaFiscal} ${item.material}`;
    let row = index.get(key);
    if (!row) {
      row = {
        notaFiscal: item.notaFiscal,
        material: item.material,
        itemCount: 0,
        totalWeight: "0",
        weights: [],
      };
      index.set(key, row);
      rows.push(row);
    }
    row.itemCount += 1;
    row.weights.push(item.weight);
  }

  return rows.map(({ weights, ...row }) => ({
    ...row,
    totalWeight: sumDecimalStrings(weights),
  }));
}
