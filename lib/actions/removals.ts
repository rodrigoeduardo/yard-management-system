"use server";

import { z } from "zod";
import { removeScannedItems } from "@/lib/db/removals";
import { combineEntryDateTimeValue } from "@/lib/loads/entry-datetime";

const removeItemsSchema = z
  .object({
    exitDateTime: z.string().min(1),
    driver: z.string().min(1),
    vehiclePlate: z.string().trim().min(1),
    qrTokens: z.array(z.uuid()).min(1),
  })
  .refine((data) => combineEntryDateTimeValue(data.exitDateTime) !== null, {
    message: "Informe uma data e hora de saída válidas.",
    path: ["exitDateTime"],
  });

export type RemoveItemsInput = z.input<typeof removeItemsSchema>;

export async function removeItems(input: RemoveItemsInput) {
  const parsed = removeItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  // Validated above by the schema's refine — never null here.
  const exitDate = combineEntryDateTimeValue(parsed.data.exitDateTime)!;

  const removal = await removeScannedItems({
    exitDate,
    driver: parsed.data.driver,
    vehiclePlate: parsed.data.vehiclePlate,
    qrTokens: parsed.data.qrTokens,
  });

  return { success: true as const, removal };
}
