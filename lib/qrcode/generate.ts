import QRCode from "qrcode";
import { getLoadWithItems } from "../db/loads";
import { buildItemQrPayload, encodeItemQrPayload, type ItemQrPayload } from "./payload";

export async function generateItemQrCode(payload: ItemQrPayload): Promise<string> {
  return QRCode.toDataURL(encodeItemQrPayload(payload));
}

export type LoadItemQrCode = {
  itemId: string;
  qrToken: string;
  payload: ItemQrPayload;
  dataUrl: string;
};

export async function getLoadItemQrCodes(
  loadId: string,
): Promise<LoadItemQrCode[]> {
  const { load, items } = await getLoadWithItems(loadId);

  return Promise.all(
    items.map(async (item, index) => {
      const payload = buildItemQrPayload({
        qrToken: item.qrToken,
        itemIndex: index + 1,
        notaFiscal: load.notaFiscal,
        material: load.material,
        weight: item.weight,
        corrida: item.corrida,
      });

      return {
        itemId: item.id,
        qrToken: item.qrToken,
        payload,
        dataUrl: await generateItemQrCode(payload),
      };
    }),
  );
}
