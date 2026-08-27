import { describe, expect, it } from "vitest";
import { buildRemovalReceipt } from "./receipt";
import type { ScannedItem } from "./scanned-item";

function makeItem(
  qrToken: string,
  overrides: Partial<Pick<ScannedItem, "number" | "notaFiscal" | "weight">> = {},
): ScannedItem {
  return {
    qrToken,
    number: overrides.number ?? 1,
    notaFiscal: overrides.notaFiscal ?? `NF-${qrToken}`,
    material: "Aço",
    weight: overrides.weight ?? "10",
    corrida: null,
  };
}

describe("buildRemovalReceipt", () => {
  it("counts the removed items, groups them by Nota Fiscal, and carries the total weight", () => {
    const a = makeItem("a", { number: 1, notaFiscal: "NF-100" });
    const b = makeItem("b", { number: 2, notaFiscal: "NF-100" });
    const c = makeItem("c", { number: 1, notaFiscal: "NF-200" });

    const receipt = buildRemovalReceipt([a, b, c], "150.5", "ABC1234");

    expect(receipt).toEqual({
      itemCount: 3,
      byNotaFiscal: [
        { notaFiscal: "NF-100", items: [a, b] },
        { notaFiscal: "NF-200", items: [c] },
      ],
      totalRemovedWeight: "150.5",
      vehiclePlate: "ABC1234",
    });
  });

  it("handles an empty item list", () => {
    const receipt = buildRemovalReceipt([], "0", "ABC1234");

    expect(receipt).toEqual({
      itemCount: 0,
      byNotaFiscal: [],
      totalRemovedWeight: "0",
      vehiclePlate: "ABC1234",
    });
  });

  it("carries the vehicle plate through", () => {
    const receipt = buildRemovalReceipt([], "0", "XYZ9999");
    expect(receipt.vehiclePlate).toBe("XYZ9999");
  });
});
