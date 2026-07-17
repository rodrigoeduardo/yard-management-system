"use server";

import { z } from "zod";
import { insertLoadWithItems } from "@/lib/db/loads";

const createLoadSchema = z.object({
  notaFiscal: z.string().min(1),
  entryDate: z.coerce.date(),
  nfWeight: z.number().positive(),
  material: z.string().min(1),
  itemWeights: z.array(z.number().positive()).min(1).max(20),
});

export type CreateLoadInput = z.input<typeof createLoadSchema>;

export type CreateLoadError = {
  formErrors: string[];
  fieldErrors: Partial<
    Record<Exclude<keyof CreateLoadInput, "itemWeights">, string[]>
  >;
  itemWeightErrors: Record<number, string[]>;
};

function toCreateLoadError(
  error: z.ZodError<z.input<typeof createLoadSchema>>,
): CreateLoadError {
  const { formErrors, fieldErrors } = error.flatten();
  const { itemWeights: _itemWeights, ...restFieldErrors } = fieldErrors;

  const itemWeightErrors: Record<number, string[]> = {};
  for (const issue of error.issues) {
    const [field, index] = issue.path;
    if (field !== "itemWeights" || typeof index !== "number") continue;
    (itemWeightErrors[index] ??= []).push(issue.message);
  }

  return { formErrors, fieldErrors: restFieldErrors, itemWeightErrors };
}

export async function createLoad(input: CreateLoadInput) {
  const parsed = createLoadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: toCreateLoadError(parsed.error) };
  }

  const load = await insertLoadWithItems({
    notaFiscal: parsed.data.notaFiscal,
    entryDate: parsed.data.entryDate,
    nfWeight: parsed.data.nfWeight.toString(),
    material: parsed.data.material,
    itemWeights: parsed.data.itemWeights.map((weight) => weight.toString()),
  });

  return { success: true as const, load };
}
