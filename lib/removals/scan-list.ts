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

/** Removes the scanned item matching `qrToken`, if present. */
export function dropScannedItem(
  list: ItemQrPayload[],
  qrToken: string,
): ItemQrPayload[] {
  return list.filter((item) => item.qrToken !== qrToken);
}

export type ScannedItemsByNotaFiscal = {
  notaFiscal: string;
  items: ItemQrPayload[];
};

/** Recovers the Nota Fiscal embedded in an item's identifier (e.g. "Item 1 - NF-100" -> "NF-100"). */
function notaFiscalFromIdentifier(identifier: string): string {
  return identifier.replace(/^Item \d+ - /, "");
}

/** Groups scanned items by their originating Nota Fiscal, preserving first-seen order. */
export function groupScannedItemsByNotaFiscal(
  list: ItemQrPayload[],
): ScannedItemsByNotaFiscal[] {
  const groups: ScannedItemsByNotaFiscal[] = [];

  for (const item of list) {
    const notaFiscal = notaFiscalFromIdentifier(item.identifier);
    const group = groups.find((g) => g.notaFiscal === notaFiscal);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ notaFiscal, items: [item] });
    }
  }

  return groups;
}
