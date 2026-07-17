"use server";

import { z } from "zod";
import { getRemovalItems } from "@/lib/db/removal-items";

const fetchRemovalItemsSchema = z.uuid();

export async function fetchRemovalItems(removalId: string) {
  const parsed = fetchRemovalItemsSchema.safeParse(removalId);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const items = await getRemovalItems(parsed.data);

  return { success: true as const, items };
}
