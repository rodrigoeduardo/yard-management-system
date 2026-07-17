import type { CreateLoadInput } from "@/lib/actions/loads";

type TopLevelField = Exclude<keyof CreateLoadInput, "itemWeights">;

type FieldErrors = Partial<Record<TopLevelField, string[]>>;

export type CreateLoadFieldMessages = Partial<Record<TopLevelField, string>>;

export type CreateLoadItemWeightMessages = Record<number, string>;

const FIELD_MESSAGES: Record<TopLevelField, string> = {
  notaFiscal: "Informe a nota fiscal.",
  entryDate: "Informe uma data de entrada válida.",
  nfWeight: "Informe o peso da nota fiscal.",
  material: "Informe o material.",
};

export function mapCreateLoadFieldErrors(
  fieldErrors: FieldErrors,
): CreateLoadFieldMessages {
  const messages: CreateLoadFieldMessages = {};

  for (const field of Object.keys(fieldErrors) as TopLevelField[]) {
    if (fieldErrors[field]?.length) {
      messages[field] = FIELD_MESSAGES[field];
    }
  }

  return messages;
}

export function mapCreateLoadItemWeightErrors(
  itemWeightErrors: Record<number, string[]>,
): CreateLoadItemWeightMessages {
  const messages: CreateLoadItemWeightMessages = {};

  for (const key of Object.keys(itemWeightErrors)) {
    const index = Number(key);
    if (itemWeightErrors[index]?.length) {
      messages[index] = `Informe um peso válido para o item ${index + 1}.`;
    }
  }

  return messages;
}
