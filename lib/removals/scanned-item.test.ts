import { describe, expect, it } from "vitest";
import { scannedItemIdentifier } from "./scanned-item";

describe("scannedItemIdentifier", () => {
  it("names the item by its printed number and originating Nota Fiscal", () => {
    const identifier = scannedItemIdentifier({
      qrToken: "a",
      number: 7,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
      corrida: null,
    });

    expect(identifier).toBe("Item 7 - NF-100");
  });
});
