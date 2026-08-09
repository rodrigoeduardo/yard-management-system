import { describe, expect, it } from "vitest";
import { groupRemovalItemsForReceiptTable } from "./receipt-table";
import type { RemovalReceiptItemDetail } from "@/lib/db/removal-items";

function makeItem(
  overrides: Partial<RemovalReceiptItemDetail> = {},
): RemovalReceiptItemDetail {
  return {
    id: overrides.id ?? "item-1",
    identifier: overrides.identifier ?? "Item 1 - NF-100",
    weight: overrides.weight ?? "10",
    notaFiscal: overrides.notaFiscal ?? "NF-100",
    material: overrides.material ?? "Aço",
  };
}

describe("groupRemovalItemsForReceiptTable", () => {
  it("prints exactly two rows for a removal spanning two NFs", () => {
    const rows = groupRemovalItemsForReceiptTable([
      makeItem({ id: "1", notaFiscal: "NF-100", material: "Aço", weight: "3" }),
      makeItem({ id: "2", notaFiscal: "NF-100", material: "Aço", weight: "2" }),
      makeItem({ id: "3", notaFiscal: "NF-100", material: "Aço", weight: "1" }),
      makeItem({ id: "4", notaFiscal: "NF-200", material: "Cobre", weight: "4" }),
      makeItem({ id: "5", notaFiscal: "NF-200", material: "Cobre", weight: "1" }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      notaFiscal: "NF-100",
      material: "Aço",
      itemCount: 3,
      totalWeight: "6",
    });
    expect(rows[1]).toEqual({
      notaFiscal: "NF-200",
      material: "Cobre",
      itemCount: 2,
      totalWeight: "5",
    });
  });

  it("prints exactly one row for 16 items of one NF and one material, whose weight equals the total", () => {
    const items = Array.from({ length: 16 }, (_, i) =>
      makeItem({ id: `item-${i}`, weight: "1.5" }),
    );

    const rows = groupRemovalItemsForReceiptTable(items);

    expect(rows).toHaveLength(1);
    expect(rows[0].itemCount).toBe(16);
    expect(rows[0].totalWeight).toBe("24");
  });

  it("sums group weights as exact decimal strings", () => {
    const rows = groupRemovalItemsForReceiptTable([
      makeItem({ id: "1", weight: "0.1" }),
      makeItem({ id: "2", weight: "0.2" }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].totalWeight).toBe("0.3");
  });

  it("renders a single row for a removal with a single item (no empty-state path)", () => {
    const rows = groupRemovalItemsForReceiptTable([makeItem()]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      notaFiscal: "NF-100",
      material: "Aço",
      itemCount: 1,
      totalWeight: "10",
    });
  });

  it("groups by both NF and material, keeping same-NF different-material items separate", () => {
    const rows = groupRemovalItemsForReceiptTable([
      makeItem({ id: "1", notaFiscal: "NF-100", material: "Aço", weight: "1" }),
      makeItem({ id: "2", notaFiscal: "NF-100", material: "Cobre", weight: "2" }),
    ]);

    expect(rows).toHaveLength(2);
  });

  it("returns an empty list for no items", () => {
    expect(groupRemovalItemsForReceiptTable([])).toEqual([]);
  });
});
