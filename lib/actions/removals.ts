"use server";

import { z } from "zod";
import { removeScannedItems } from "@/lib/db/removals";
import { combineEntryDateTime } from "@/lib/loads/entry-datetime";

const removeItemsSchema = z
  .object({
    exitDate: z.string().min(1),
    exitTime: z.string().min(1),
    driver: z.string().min(1),
    qrTokens: z.array(z.uuid()).min(1),
  })
  .refine(
    (data) => combineEntryDateTime(data.exitDate, data.exitTime) !== null,
    {
      message: "Informe uma data e hora de saída válidas.",
      path: ["exitDate"],
    },
  );

export type RemoveItemsInput = z.input<typeof removeItemsSchema>;

export async function removeItems(input: RemoveItemsInput) {
  const parsed = removeItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  // Validated above by the schema's refine — never null here.
  const exitDate = combineEntryDateTime(
    parsed.data.exitDate,
    parsed.data.exitTime,
  )!;

  const removal = await removeScannedItems({
    exitDate,
    driver: parsed.data.driver,
    qrTokens: parsed.data.qrTokens,
  });

  return { success: true as const, removal };
}
