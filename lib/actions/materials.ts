"use server";

import { z } from "zod";
import {
  createMaterial,
  MaterialNameConflictError,
  renameMaterial,
} from "@/lib/db/materials";

const materialNameSchema = z.object({
  name: z.string().trim().min(1),
});

export type CreateMaterialInput = z.input<typeof materialNameSchema>;

const DUPLICATE_ISSUE = "duplicate";

export async function createMaterialAction(input: CreateMaterialInput) {
  const parsed = materialNameSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const material = await createMaterial(parsed.data.name);
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
  const parsed = renameMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  try {
    const material = await renameMaterial(parsed.data.id, parsed.data.name);
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
