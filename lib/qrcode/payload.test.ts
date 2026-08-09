import { describe, expect, it } from "vitest";
import {
  buildItemQrPayload,
  decodeItemQrPayload,
  encodeItemQrPayload,
  safeDecodeItemQrPayload,
} from "./payload";

describe("item QR payload", () => {
  it("round-trips identifier, notaFiscal, material, and weight through encode/decode", () => {
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
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    });
  });

  it("decodes an already-printed payload that lacks the distinct notaFiscal field", () => {
    const legacyPayload = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-123",
      material: "Aço",
      weight: "10.5",
    };

    const decoded = decodeItemQrPayload(JSON.stringify(legacyPayload));

    expect(decoded).toEqual(legacyPayload);
    expect(decoded.notaFiscal).toBeUndefined();
  });

  it("safely decodes a valid payload", () => {
    const payload = buildItemQrPayload({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    });

    expect(safeDecodeItemQrPayload(encodeItemQrPayload(payload))).toEqual(
      payload,
    );
  });

  it("builds a payload carrying notaFiscal as a distinct field", () => {
    const payload = buildItemQrPayload({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    });

    expect(payload.notaFiscal).toBe("NF-123");
  });

  it("safely decoding non-QR-payload text returns null instead of throwing", () => {
    expect(safeDecodeItemQrPayload("not a payload")).toBeNull();
  });

  it("carries corrida as a distinct field when provided", () => {
    const payload = buildItemQrPayload({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: "C-4471",
    });

    const decoded = decodeItemQrPayload(encodeItemQrPayload(payload));

    expect(decoded.corrida).toBe("C-4471");
  });

  it("omits corrida when the item has none (NULL corrida)", () => {
    const payload = buildItemQrPayload({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      itemIndex: 1,
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
      corrida: null,
    });

    const decoded = decodeItemQrPayload(encodeItemQrPayload(payload));

    expect(decoded.corrida).toBeUndefined();
  });

  it("decodes an already-printed payload that lacks the corrida field", () => {
    const legacyPayload = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-123",
      notaFiscal: "NF-123",
      material: "Aço",
      weight: "10.5",
    };

    const decoded = decodeItemQrPayload(JSON.stringify(legacyPayload));

    expect(decoded.corrida).toBeUndefined();
  });
});
