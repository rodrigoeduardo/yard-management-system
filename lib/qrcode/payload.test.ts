import { describe, expect, it } from "vitest";
import {
  decodeItemQrPayload,
  encodeItemQrPayload,
  safeDecodeItemQrPayload,
} from "./payload";

const QR_TOKEN = "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a";

describe("item QR payload", () => {
  it("encodes the item's identity and nothing else", () => {
    const encoded = encodeItemQrPayload({ qrToken: QR_TOKEN });

    expect(JSON.parse(encoded)).toEqual({ qrToken: QR_TOKEN });
  });

  it("round-trips the qrToken through encode/decode", () => {
    const decoded = decodeItemQrPayload(
      encodeItemQrPayload({ qrToken: QR_TOKEN }),
    );

    expect(decoded).toEqual({ qrToken: QR_TOKEN });
  });

  it("decodes an already-printed payload, keeping only its qrToken", () => {
    const legacyPayload = {
      qrToken: QR_TOKEN,
      identifier: "Item 1 - NF-123",
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: "C-4471",
    };

    const decoded = decodeItemQrPayload(JSON.stringify(legacyPayload));

    expect(decoded).toEqual({ qrToken: QR_TOKEN });
  });

  it("safely decodes a valid payload", () => {
    expect(
      safeDecodeItemQrPayload(encodeItemQrPayload({ qrToken: QR_TOKEN })),
    ).toEqual({ qrToken: QR_TOKEN });
  });

  it("safely decoding non-QR-payload text returns null instead of throwing", () => {
    expect(safeDecodeItemQrPayload("not a payload")).toBeNull();
  });

  it("safely decoding a JSON object without a qrToken returns null", () => {
    expect(
      safeDecodeItemQrPayload(JSON.stringify({ identifier: "Item 1 - NF-1" })),
    ).toBeNull();
  });
});
