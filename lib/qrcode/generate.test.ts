import { PNG } from "pngjs";
import jsQR from "jsqr";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { insertLoadWithItems } from "../db/loads";
import { items, loads } from "../db/schema";
import { decodeItemQrPayload } from "./payload";
import { generateItemQrCode, getLoadItemQrCodes } from "./generate";

function decodeQrDataUrl(dataUrl: string): string {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const png = PNG.sync.read(Buffer.from(base64, "base64"));
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!result) {
    throw new Error("Failed to decode QR code in test");
  }
  return result.data;
}

describe("generateItemQrCode", () => {
  it("produces a QR code whose scanned payload decodes back to the correct identifier, material, and weight", async () => {
    const dataUrl = await generateItemQrCode({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-999",
      material: "Aço",
      weight: "12.5",
    });

    const decoded = decodeItemQrPayload(decodeQrDataUrl(dataUrl));

    expect(decoded).toEqual({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-999",
      material: "Aço",
      weight: "12.5",
    });
  });
});

describe("getLoadItemQrCodes", () => {
  const createdLoadIds: string[] = [];

  afterEach(async () => {
    while (createdLoadIds.length > 0) {
      const id = createdLoadIds.pop()!;
      await db.delete(items).where(eq(items.loadId, id));
      await db.delete(loads).where(eq(loads.id, id));
    }
  });

  it("fetches and generates one QR code per item, keyed on the item's qr_token, decodable back to its identifier/material/weight", async () => {
    const notaFiscal = `NF-QR-${Date.now()}`;
    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-123456",
      driver: "João da Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10", "20"],
      itemCorridas: ["C-4471", "C-9902"],
    });
    createdLoadIds.push(load.id);

    const qrCodes = await getLoadItemQrCodes(load.id);

    expect(qrCodes).toHaveLength(2);
    const decodedPayloads = qrCodes.map((qr) =>
      decodeItemQrPayload(decodeQrDataUrl(qr.dataUrl)),
    );
    expect(decodedPayloads.map((p) => p.identifier).sort()).toEqual([
      `Item 1 - ${notaFiscal}`,
      `Item 2 - ${notaFiscal}`,
    ]);
    expect(decodedPayloads.every((p) => p.material === "Aço")).toBe(true);
    expect(decodedPayloads.map((p) => p.weight).sort()).toEqual(["10", "20"]);
    expect(new Set(qrCodes.map((qr) => qr.qrToken)).size).toBe(2);
    expect(decodedPayloads.map((p) => p.qrToken).sort()).toEqual(
      qrCodes.map((qr) => qr.qrToken).sort(),
    );
    expect(decodedPayloads.map((p) => p.corrida).sort()).toEqual([
      "C-4471",
      "C-9902",
    ]);
  });

  it("omits corrida from the payload for an item whose corrida is NULL", async () => {
    const notaFiscal = `NF-QR-NOCORRIDA-${Date.now()}`;
    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-123457",
      driver: "João da Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10"],
      itemCorridas: [null],
    });
    createdLoadIds.push(load.id);

    const qrCodes = await getLoadItemQrCodes(load.id);
    const [decoded] = qrCodes.map((qr) =>
      decodeItemQrPayload(decodeQrDataUrl(qr.dataUrl)),
    );

    expect(decoded.corrida).toBeUndefined();
  });
});
