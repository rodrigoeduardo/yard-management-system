import { z } from "zod";
import { formatEntryDateTime } from "@/lib/format/datetime";
import { formatWeight } from "@/lib/format/weight";

export function isValidRemovalId(id: string): boolean {
  return z.uuid().safeParse(id).success;
}

/**
 * Whether `pathname` is the printable receipt page for a removal
 * (`/removals/<id>/receipt`). Used to keep the demo banner (#252) off the
 * printable output, mirroring `isQrPrintRoute` in `lib/loads/print.ts`.
 */
export function isReceiptPrintRoute(pathname: string): boolean {
  return /^\/removals\/[^/]+\/receipt$/.test(pathname);
}

export type RemovalReceiptSummary = {
  exitDate: string;
  driver: string;
  vehiclePlate: string;
  totalRemovedWeight: string;
};

/**
 * Formats a removal's header fields for the printable receipt
 * (business-rules.md#load-removal). A legacy removal recorded before the
 * vehicle plate was required renders an em dash instead of a blank field.
 */
export function formatRemovalReceiptSummary(removal: {
  exitDate: Date;
  driver: string;
  vehiclePlate: string | null;
  totalRemovedWeight: string;
}): RemovalReceiptSummary {
  return {
    exitDate: formatEntryDateTime(removal.exitDate),
    driver: removal.driver,
    vehiclePlate: removal.vehiclePlate ?? "—",
    totalRemovedWeight: formatWeight(removal.totalRemovedWeight),
  };
}
