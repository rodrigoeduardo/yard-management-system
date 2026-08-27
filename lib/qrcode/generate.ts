import QRCode from "qrcode";
import { getLoadWithItems } from "../db/loads";
import { buildItemQrLabel, type ItemQrLabel } from "./label";
import { encodeItemQrPayload, type ItemQrPayload } from "./payload";

export async function generateItemQrCode(payload: ItemQrPayload): Promise<string> {
  return QRCode.toDataURL(encodeItemQrPayload(payload));
}

export type LoadItemQrCode = {
  itemId: string;
  qrToken: string;
  /** Printed text beside the code — read from the item's row, not encoded in it. */
  label: ItemQrLabel;
  dataUrl: string;
};

export async function getLoadItemQrCodes(
  loadId: string,
): Promise<LoadItemQrCode[]> {
  const { load, items } = await getLoadWithItems(loadId);

  return Promise.all(
    items.map(async (item) => ({
      itemId: item.id,
      qrToken: item.qrToken,
      label: buildItemQrLabel({
        itemNumber: item.number,
        notaFiscal: load.notaFiscal,
        material: load.material,
        weight: item.weight,
        corrida: item.corrida,
      }),
      dataUrl: await generateItemQrCode({ qrToken: item.qrToken }),
    })),
  );
}
