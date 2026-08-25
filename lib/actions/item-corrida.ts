"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { updateItemCorrida } from "@/lib/db/items";
import { isLoadEditEnabled } from "@/lib/inventory/feature-flags";
import { isViewerWriteRefused, VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

const updateItemCorridaSchema = z.object({
  itemId: z.uuid("Informe um item válido."),
  corrida: z.string().trim().min(1, "Informe a corrida."),
});

export type UpdateItemCorridaInput = z.input<typeof updateItemCorridaSchema>;

/** Corrects an in-stock item's corrida only when FEATURE_LOAD_EDIT is enabled (#353). */
export async function updateItemCorridaAction(input: UpdateItemCorridaInput) {
  if (await isViewerWriteRefused()) {
    return { success: false as const, error: VIEWER_WRITE_ERROR_MESSAGE };
  }

  if (!isLoadEditEnabled()) {
    return {
      success: false as const,
      error: "Edição de corrida está desabilitada.",
    };
  }

  const parsed = updateItemCorridaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const item = await updateItemCorrida(
      parsed.data.itemId,
      parsed.data.corrida,
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
