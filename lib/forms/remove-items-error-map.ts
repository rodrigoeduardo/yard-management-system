import type { RemoveItemsInput } from "@/lib/actions/removals";

type FieldErrors = Partial<Record<keyof RemoveItemsInput, string[]>>;

export type RemoveItemsFieldMessages = Partial<
  Record<keyof RemoveItemsInput, string>
>;

const FIELD_MESSAGES: Record<keyof RemoveItemsInput, string> = {
  exitDate: "Informe uma data de saída válida.",
  exitTime: "Informe uma hora de saída válida.",
  driver: "Informe o motorista.",
  qrTokens: "Escaneie ao menos um item.",
};

export function mapRemoveItemsFieldErrors(
  fieldErrors: FieldErrors,
): RemoveItemsFieldMessages {
  const messages: RemoveItemsFieldMessages = {};

  for (const field of Object.keys(fieldErrors) as (keyof RemoveItemsInput)[]) {
    if (fieldErrors[field]?.length) {
      messages[field] = FIELD_MESSAGES[field];
    }
  }

  return messages;
}
