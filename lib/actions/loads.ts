"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { insertLoadWithItems } from "@/lib/db/loads";
import { combineEntryDateTimeValue } from "@/lib/loads/entry-datetime";

const createLoadSchema = z
  .object({
    notaFiscal: z.string().min(1),
    entryDateTime: z.string().min(1),
    nfWeight: z.number().positive(),
    material: z.string().min(1),
    itemWeights: z.array(z.number().positive()).min(1).max(20),
  })
  .refine((data) => combineEntryDateTimeValue(data.entryDateTime) !== null, {
    message: "Informe uma data e hora de entrada válidas.",
    path: ["entryDateTime"],
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
  const restFieldErrors: CreateLoadError["fieldErrors"] = {};
  for (const field of Object.keys(fieldErrors) as (keyof typeof fieldErrors)[]) {
    if (field === "itemWeights") continue;
    restFieldErrors[field] = fieldErrors[field];
  }

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

  // Validated above by the schema's refine — never null here.
  const entryDate = combineEntryDateTimeValue(parsed.data.entryDateTime)!;
  const userId = await getCurrentUserId();

  const load = await insertLoadWithItems(
    {
      notaFiscal: parsed.data.notaFiscal,
      entryDate,
      nfWeight: parsed.data.nfWeight.toString(),
      material: parsed.data.material,
      itemWeights: parsed.data.itemWeights.map((weight) => weight.toString()),
    },
    userId,
  );

  return { success: true as const, load };
}
