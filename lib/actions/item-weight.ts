"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { updateItemWeight } from "@/lib/db/items";
import { isItemWeightEditEnabled } from "@/lib/inventory/feature-flags";
import { isViewerWriteRefused, VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

const updateItemWeightSchema = z.object({
  itemId: z.uuid("Informe um item válido."),
  weight: z
    .number("Informe um peso válido.")
    .finite("Informe um peso válido.")
    .positive("Informe um peso maior que zero."),
});

export type UpdateItemWeightInput = z.input<typeof updateItemWeightSchema>;

/** Corrects an in-stock item only when the server-side rollout flag is enabled. */
export async function updateItemWeightAction(input: UpdateItemWeightInput) {
  if (await isViewerWriteRefused()) {
    return { success: false as const, error: VIEWER_WRITE_ERROR_MESSAGE };
  }

  if (!isItemWeightEditEnabled()) {
    return {
      success: false as const,
      error: "Edição de peso está desabilitada.",
    };
  }

  const parsed = updateItemWeightSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const item = await updateItemWeight(
      parsed.data.itemId,
      parsed.data.weight.toString(),
      await getCurrentUserId(),
    );
    return { success: true as const, item };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}
