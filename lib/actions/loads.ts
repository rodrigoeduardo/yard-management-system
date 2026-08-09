"use server";

import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { insertLoadWithItems } from "@/lib/db/loads";
import {
  combineEntryDateTimeValue,
  isValidCalendarDateValue,
} from "@/lib/loads/entry-datetime";
import { isViewerWriteRefused, VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

const createLoadSchema = z
  .object({
    notaFiscal: z.string().min(1),
    transportOrder: z.string().min(1),
    driver: z.string().min(1),
    nfDate: z.string().min(1),
    entryDateTime: z.string().min(1),
    nfWeight: z.number().positive(),
    material: z.string().min(1),
    itemWeights: z.array(z.number().positive()).min(1).max(20),
    itemCorridas: z.array(z.string().min(1)).min(1).max(20),
  })
  .refine((data) => combineEntryDateTimeValue(data.entryDateTime) !== null, {
    message: "Informe uma data e hora de entrada válidas.",
    path: ["entryDateTime"],
  })
  .refine((data) => isValidCalendarDateValue(data.nfDate), {
    message: "Informe uma data da nota fiscal válida.",
    path: ["nfDate"],
  });

export type CreateLoadInput = z.input<typeof createLoadSchema>;

type PerItemField = "itemWeights" | "itemCorridas";

export type CreateLoadError = {
  formErrors: string[];
  fieldErrors: Partial<
    Record<Exclude<keyof CreateLoadInput, PerItemField>, string[]>
  >;
  itemWeightErrors: Record<number, string[]>;
  itemCorridaErrors: Record<number, string[]>;
};

function toCreateLoadError(
  error: z.ZodError<z.input<typeof createLoadSchema>>,
): CreateLoadError {
  const { formErrors, fieldErrors } = error.flatten();
  const restFieldErrors: CreateLoadError["fieldErrors"] = {};
  for (const field of Object.keys(fieldErrors) as (keyof typeof fieldErrors)[]) {
    if (field === "itemWeights" || field === "itemCorridas") continue;
    restFieldErrors[field] = fieldErrors[field];
  }

  const itemWeightErrors: Record<number, string[]> = {};
  const itemCorridaErrors: Record<number, string[]> = {};
  for (const issue of error.issues) {
    const [field, index] = issue.path;
    if (typeof index !== "number") continue;
    if (field === "itemWeights") {
      (itemWeightErrors[index] ??= []).push(issue.message);
    } else if (field === "itemCorridas") {
      (itemCorridaErrors[index] ??= []).push(issue.message);
    }
  }

  return {
    formErrors,
    fieldErrors: restFieldErrors,
    itemWeightErrors,
    itemCorridaErrors,
  };
}

export async function createLoad(input: CreateLoadInput) {
  if (await isViewerWriteRefused()) {
    return {
      success: false as const,
      error: {
        formErrors: [VIEWER_WRITE_ERROR_MESSAGE],
        fieldErrors: {},
        itemWeightErrors: {},
        itemCorridaErrors: {},
      },
    };
  }

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
      transportOrder: parsed.data.transportOrder,
      driver: parsed.data.driver,
      nfDate: parsed.data.nfDate,
      entryDate,
      nfWeight: parsed.data.nfWeight.toString(),
      material: parsed.data.material,
      itemWeights: parsed.data.itemWeights.map((weight) => weight.toString()),
      itemCorridas: parsed.data.itemCorridas,
    },
    userId,
  );

  return { success: true as const, load };
}
