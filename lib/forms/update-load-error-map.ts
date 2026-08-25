import type { UpdateLoadInput } from "@/lib/actions/loads";

type TopLevelField = Exclude<keyof UpdateLoadInput, "loadId">;

type FieldErrors = Partial<Record<TopLevelField, string[]>>;

export type UpdateLoadFieldMessages = Partial<Record<TopLevelField, string>>;

const FIELD_MESSAGES: Record<TopLevelField, string> = {
  notaFiscal: "Informe a nota fiscal.",
  transportOrder: "Informe a ordem de transporte.",
  driver: "Informe o motorista.",
  nfDate: "Informe a data da nota fiscal.",
  entryDateTime: "Informe uma data e hora de entrada válidas.",
  nfWeight: "Informe o peso da nota fiscal.",
  material: "Informe o material.",
};

export function mapUpdateLoadFieldErrors(
  fieldErrors: FieldErrors,
): UpdateLoadFieldMessages {
  const messages: UpdateLoadFieldMessages = {};

  for (const field of Object.keys(fieldErrors) as TopLevelField[]) {
    if (fieldErrors[field]?.length) {
      messages[field] = FIELD_MESSAGES[field];
    }
  }

  return messages;
}
