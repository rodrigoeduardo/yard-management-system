import type { CreateLoadInput } from "@/lib/actions/loads";

type FieldErrors = Partial<Record<keyof CreateLoadInput, string[]>>;

export type CreateLoadFieldMessages = Partial<
  Record<keyof CreateLoadInput, string>
>;

const FIELD_MESSAGES: Record<keyof CreateLoadInput, string> = {
  notaFiscal: "Informe a nota fiscal.",
  entryDate: "Informe uma data de entrada válida.",
  nfWeight: "Informe o peso da nota fiscal.",
  material: "Informe o material.",
  itemWeights: "Informe um peso válido para cada item.",
};

export function mapCreateLoadFieldErrors(
  fieldErrors: FieldErrors,
): CreateLoadFieldMessages {
  const messages: CreateLoadFieldMessages = {};

  for (const field of Object.keys(fieldErrors) as (keyof CreateLoadInput)[]) {
    if (fieldErrors[field]?.length) {
      messages[field] = FIELD_MESSAGES[field];
    }
  }

  return messages;
}
