import type { ItemQrPayload } from "../qrcode/payload";

export type AddScannedItemResult = {
  list: ItemQrPayload[];
  error?: string;
};

export function addScannedItem(
  list: ItemQrPayload[],
  item: ItemQrPayload,
): AddScannedItemResult {
  if (list.some((scanned) => scanned.qrToken === item.qrToken)) {
    return { list, error: "Este item já foi escaneado nesta remoção." };
  }

  return { list: [...list, item] };
}
