"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { cancelRemoval } from "@/lib/db/removals";
import { isRemovalCancelEnabled } from "@/lib/removals/feature-flags";

const cancelRemovalSchema = z.uuid();

/**
 * Cancels a removal (issue #310), reversing it exactly: items go back to
 * `in_stock` and each affected load is credited back. Gated by
 * `FEATURE_REMOVAL_CANCEL` here too — not only in the UI — so the action
 * path itself is inert while the flag is off, regardless of what a client
 * calls.
 */
export async function cancelRemovalAction(removalId: string) {
  if (!isRemovalCancelEnabled()) {
    return {
      success: false as const,
      error: "Cancelamento de remoção está desabilitado.",
    };
  }

  const parsed = cancelRemovalSchema.safeParse(removalId);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const userId = await getCurrentUserId();

  try {
    const removal = await cancelRemoval(parsed.data, userId);
    return { success: true as const, removal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}
