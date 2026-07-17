"use server";

import { z } from "zod";
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
