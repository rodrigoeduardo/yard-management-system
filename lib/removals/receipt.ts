import type { ItemQrPayload } from "../qrcode/payload";
import {
  groupScannedItemsByNotaFiscal,
  type ScannedItemsByNotaFiscal,
} from "./scan-list";

export type RemovalReceipt = {
  itemCount: number;
  byNotaFiscal: ScannedItemsByNotaFiscal[];
  totalRemovedWeight: string;
  vehiclePlate: string;
};

/** Summarizes a completed removal for the post-submit receipt screen. */
export function buildRemovalReceipt(
  items: ItemQrPayload[],
  totalRemovedWeight: string,
  vehiclePlate: string,
): RemovalReceipt {
  return {
    itemCount: items.length,
    byNotaFiscal: groupScannedItemsByNotaFiscal(items),
    totalRemovedWeight,
    vehiclePlate,
  };
}
