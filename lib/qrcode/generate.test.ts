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
  it("produces a QR code carrying the item's identity and nothing else", async () => {
    const dataUrl = await generateItemQrCode({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
    });

    const scanned = decodeQrDataUrl(dataUrl);

    expect(JSON.parse(scanned)).toEqual({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
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

  it("generates one QR code per item, each carrying only that item's qr_token", async () => {
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
    expect(new Set(qrCodes.map((qr) => qr.qrToken)).size).toBe(2);
    expect(decodedPayloads.map((p) => p.qrToken).sort()).toEqual(
      qrCodes.map((qr) => qr.qrToken).sort(),
    );
    expect(decodedPayloads.every((p) => Object.keys(p).length === 1)).toBe(true);
  });

  it("labels each item with its printed identifier, material, weight, and corrida", async () => {
    const notaFiscal = `NF-QR-LABEL-${Date.now()}`;
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

    expect(qrCodes.map((qr) => qr.label.identifier).sort()).toEqual([
      `Item 1 - ${notaFiscal}`,
      `Item 2 - ${notaFiscal}`,
    ]);
    expect(qrCodes.every((qr) => qr.label.material === "Aço")).toBe(true);
    expect(qrCodes.every((qr) => qr.label.notaFiscal === notaFiscal)).toBe(true);
    expect(qrCodes.map((qr) => qr.label.weight).sort()).toEqual(["10", "20"]);
    expect(qrCodes.map((qr) => qr.label.corrida).sort()).toEqual([
      "C-4471",
      "C-9902",
    ]);
  });

  it("prints an item's current weight after a weight correction", async () => {
    const notaFiscal = `NF-QR-EDITED-${Date.now()}`;
    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-123456",
      driver: "João da Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10"],
      itemCorridas: [null],
    });
    createdLoadIds.push(load.id);

    const [before] = await getLoadItemQrCodes(load.id);
    await db.update(items).set({ weight: "12" }).where(eq(items.id, before.itemId));

    const [after] = await getLoadItemQrCodes(load.id);

    expect(after.label.weight).toBe("12");
    expect(after.qrToken).toBe(before.qrToken);
  });

  it("keeps every remaining item's label identical after another item in the load is removed", async () => {
    const notaFiscal = `NF-QR-STABLE-${Date.now()}`;
    const load = await insertLoadWithItems({
      notaFiscal,
      transportOrder: "OT-123458",
      driver: "João da Silva",
      nfDate: "2026-01-01",
      entryDate: new Date("2026-01-01"),
      nfWeight: "500",
      material: "Aço",
      itemWeights: ["10", "20", "30"],
      itemCorridas: ["C-1", "C-2", "C-3"],
    });
    createdLoadIds.push(load.id);

    const before = await getLoadItemQrCodes(load.id);

    // Mark item 1 removed, mimicking a load-removal UPDATE. This rewrites its
    // tuple at the end of the heap (the defect #336 fixes), so a stale
    // implementation would renumber items 2 and 3.
    const firstItem = before.find(
      (qr) => qr.label.identifier === `Item 1 - ${notaFiscal}`,
    )!;
    await db.update(items).set({ status: "removed" }).where(eq(items.id, firstItem.itemId));

    const after = await getLoadItemQrCodes(load.id);
    const remainingBefore = before.filter((qr) => qr.itemId !== firstItem.itemId);
    for (const qr of remainingBefore) {
      const match = after.find((a) => a.itemId === qr.itemId);
      expect(match?.label).toEqual(qr.label);
    }
  });

  it("omits corrida from the label for an item whose corrida is NULL", async () => {
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

    const [qrCode] = await getLoadItemQrCodes(load.id);

    expect(qrCode.label.corrida).toBeUndefined();
  });
});
