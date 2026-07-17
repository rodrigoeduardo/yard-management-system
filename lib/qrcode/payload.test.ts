import { describe, expect, it } from "vitest";
import { buildItemQrPayload, decodeItemQrPayload, encodeItemQrPayload } from "./payload";

describe("item QR payload", () => {
  it("round-trips identifier, material, and weight through encode/decode", () => {
    const payload = buildItemQrPayload({
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    });

    const decoded = decodeItemQrPayload(encodeItemQrPayload(payload));

    expect(decoded).toEqual({
      identifier: "Item 1 - NF-123",
      material: "Aço",
      weight: "10.5",
    });
  });
});
