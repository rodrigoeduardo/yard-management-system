"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import {
  createMaterial,
  MaterialNameConflictError,
  renameMaterial,
} from "@/lib/db/materials";
import { isViewerWriteRefused, VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

const materialNameSchema = z.object({
  name: z.string().trim().min(1),
});

export type CreateMaterialInput = z.input<typeof materialNameSchema>;

const DUPLICATE_ISSUE = "duplicate";

export async function createMaterialAction(input: CreateMaterialInput) {
  if (await isViewerWriteRefused()) {
    return {
      success: false as const,
      error: { formErrors: [VIEWER_WRITE_ERROR_MESSAGE], fieldErrors: {} },
    };
  }

  const parsed = materialNameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const userId = await getCurrentUserId();
    const material = await createMaterial(parsed.data.name, userId);
    return { success: true as const, material };
  } catch (error) {
    if (error instanceof MaterialNameConflictError) {
      return {
        success: false as const,
        error: {
          formErrors: [],
          fieldErrors: { name: [DUPLICATE_ISSUE] },
        },
      };
    }
    throw error;
  }
}

const renameMaterialSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
});

export type RenameMaterialInput = z.input<typeof renameMaterialSchema>;

export async function renameMaterialAction(input: RenameMaterialInput) {
  if (await isViewerWriteRefused()) {
    return {
      success: false as const,
      error: { formErrors: [VIEWER_WRITE_ERROR_MESSAGE], fieldErrors: {} },
    };
  }

  const parsed = renameMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const userId = await getCurrentUserId();
    const material = await renameMaterial(
      parsed.data.id,
      parsed.data.name,
      userId,
    );
    return { success: true as const, material };
  } catch (error) {
    if (error instanceof MaterialNameConflictError) {
      return {
        success: false as const,
        error: {
          formErrors: [],
          fieldErrors: { name: [DUPLICATE_ISSUE] },
        },
      };
    }
    throw error;
  }
}
