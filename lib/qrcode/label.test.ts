import { describe, expect, it } from "vitest";
import { buildItemQrLabel } from "./label";

describe("buildItemQrLabel", () => {
  it("labels the item with its own number and originating Nota Fiscal", () => {
    const label = buildItemQrLabel({
      itemNumber: 7,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: "C-4471",
    });

    expect(label).toEqual({
      identifier: "Item 7 - NF-123",
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: "C-4471",
    });
  });

  it("omits corrida when the item has none (NULL corrida)", () => {
    const label = buildItemQrLabel({
      itemNumber: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: null,
    });

    expect(label.corrida).toBeUndefined();
  });
});
