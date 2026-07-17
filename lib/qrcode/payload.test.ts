import { describe, expect, it } from "vitest";
import { buildItemQrPayload, decodeItemQrPayload, encodeItemQrPayload } from "./payload";

describe("item QR payload", () => {
  it("round-trips identifier, material, and weight through encode/decode", () => {
    const payload = buildItemQrPayload({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    });

    const decoded = decodeItemQrPayload(encodeItemQrPayload(payload));

    expect(decoded).toEqual({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-123",
      material: "Aço",
      weight: "10.5",
    });
  });
});
