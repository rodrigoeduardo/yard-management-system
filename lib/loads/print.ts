import { z } from "zod";
import { formatEntryDateTime } from "@/lib/format/datetime";

export function isValidLoadId(id: string): boolean {
  return z.uuid().safeParse(id).success;
}

/**
 * Whether `pathname` is the QR-codes print page for a load
 * (`/loads/<id>/print`). Used to keep the demo banner (#252) off the
 * printable output.
 */
export function isQrPrintRoute(pathname: string): boolean {
  return /^\/loads\/[^/]+\/print$/.test(pathname);
}

export type LoadSummary = {
  notaFiscal: string;
  material: string;
  entryDate: string;
  itemCount: number;
};

export function formatLoadSummary(load: {
  notaFiscal: string;
  material: string;
  entryDate: Date;
  itemCount: number;
}): LoadSummary {
  return {
    notaFiscal: load.notaFiscal,
    material: load.material,
    entryDate: formatEntryDateTime(load.entryDate),
    itemCount: load.itemCount,
  };
}
