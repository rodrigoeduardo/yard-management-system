"use server";

import { z } from "zod";
import { getLoadForEdit as getLoadForEditFromDb } from "@/lib/db/loads";
import { getLoadItems } from "@/lib/db/load-items";

const fetchLoadItemsSchema = z.uuid();

export async function fetchLoadItems(loadId: string) {
  const parsed = fetchLoadItemsSchema.safeParse(loadId);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const items = await getLoadItems(parsed.data);

  return { success: true as const, items };
}

const fetchLoadForEditSchema = z.uuid();

/**
 * Reads a load's raw (unformatted) fields for the "Editar carga" form
 * (#352) — a read, exempt from the viewer write guard like `fetchLoadItems`
 * above. `StockRow` (the load-detail modal's other data source) carries
 * pre-formatted display strings; this reads the load fresh instead of
 * reverse-parsing those.
 */
export async function fetchLoadForEdit(loadId: string) {
  const parsed = fetchLoadForEditSchema.safeParse(loadId);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const load = await getLoadForEditFromDb(parsed.data);
  if (!load) {
    return { success: false as const, error: "Carga não encontrada." };
  }

  return { success: true as const, load };
}
