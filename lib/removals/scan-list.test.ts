import { describe, expect, it } from "vitest";
import { addScannedItem, dropScannedItem, groupScannedItemsByNotaFiscal } from "./scan-list";
import type { ItemQrPayload } from "../qrcode/payload";

function makeItem(
  qrToken: string,
  overrides: Partial<Pick<ItemQrPayload, "identifier" | "weight">> = {},
): ItemQrPayload {
  return {
    qrToken,
    identifier: overrides.identifier ?? `Item 1 - NF-${qrToken}`,
    material: "Aço",
    weight: overrides.weight ?? "10",
  };
}

describe("addScannedItem", () => {
  it("appends a new scanned item to the list", () => {
    const item = makeItem("a");
    const result = addScannedItem([], item);

    expect(result.error).toBeUndefined();
    expect(result.list).toEqual([item]);
  });

  it("rejects an item already in the running list, leaving the list unchanged", () => {
    const item = makeItem("a");
    const result = addScannedItem([item], item);

    expect(result.error).toBe("Este item já foi escaneado nesta remoção.");
    expect(result.list).toEqual([item]);
  });
});

describe("dropScannedItem", () => {
  it("removes the item matching the given qrToken", () => {
    const a = makeItem("a");
    const b = makeItem("b");

    expect(dropScannedItem([a, b], "a")).toEqual([b]);
  });

  it("leaves the list unchanged when the qrToken is not present", () => {
    const a = makeItem("a");

    expect(dropScannedItem([a], "missing")).toEqual([a]);
  });

  it("returns an empty list when dropping the only item", () => {
    const a = makeItem("a");

    expect(dropScannedItem([a], "a")).toEqual([]);
  });
});

describe("groupScannedItemsByNotaFiscal", () => {
  it("groups items by the Nota Fiscal embedded in their identifier", () => {
    const a = makeItem("a", { identifier: "Item 1 - NF-100" });
    const b = makeItem("b", { identifier: "Item 2 - NF-100" });
    const c = makeItem("c", { identifier: "Item 1 - NF-200" });

    expect(groupScannedItemsByNotaFiscal([a, b, c])).toEqual([
      { notaFiscal: "NF-100", items: [a, b] },
      { notaFiscal: "NF-200", items: [c] },
    ]);
  });

  it("preserves first-seen NF order and returns an empty array for an empty list", () => {
    expect(groupScannedItemsByNotaFiscal([])).toEqual([]);
  });
});
