"use server";

import { z } from "zod";
import { removeScannedItems } from "@/lib/db/removals";

const removeItemsSchema = z.object({
  exitDate: z.coerce.date(),
  driver: z.string().min(1),
  qrTokens: z.array(z.uuid()).min(1),
});

export type RemoveItemsInput = z.input<typeof removeItemsSchema>;

export async function removeItems(input: RemoveItemsInput) {
  const parsed = removeItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const removal = await removeScannedItems(parsed.data);

  return { success: true as const, removal };
}
