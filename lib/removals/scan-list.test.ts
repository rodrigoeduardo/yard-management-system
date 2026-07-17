import { describe, expect, it } from "vitest";
import { addScannedItem } from "./scan-list";
import type { ItemQrPayload } from "../qrcode/payload";

function makeItem(qrToken: string): ItemQrPayload {
  return {
    qrToken,
    identifier: `Item 1 - NF-${qrToken}`,
    material: "Aço",
    weight: "10",
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
