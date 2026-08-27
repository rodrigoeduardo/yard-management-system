/**
 * One item on the removal screen's scanned list, as resolved from the
 * database at scan time (see `checkItemStatus`). Deliberately *not* whatever
 * the QR code contained: the code carries only the item's `qr_token`, so a
 * label printed before a weight or corrida correction still shows the
 * item's current data once scanned.
 */
export type ScannedItem = {
  qrToken: string;
  /** The number printed on the item's physical label ("Item <number> - <NF>"). */
  number: number;
  notaFiscal: string;
  material: string;
  weight: string;
  corrida: string | null;
};

/** The item's printed name, e.g. "Item 7 - NF-100". */
export function scannedItemIdentifier(item: ScannedItem): string {
  return `Item ${item.number} - ${item.notaFiscal}`;
}
