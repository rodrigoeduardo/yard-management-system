import { z } from "zod";
import { formatEntryDateTime } from "@/lib/format/datetime";

export function isValidLoadId(id: string): boolean {
  return z.uuid().safeParse(id).success;
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
