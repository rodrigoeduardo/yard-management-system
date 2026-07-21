type FieldErrors = Partial<Record<"name", string[]>>;

export type MaterialFieldMessages = Partial<Record<"name", string>>;

const EMPTY_NAME_MESSAGE = "Informe o nome do material.";
const DUPLICATE_NAME_MESSAGE = "Já existe um material com esse nome.";

export function mapMaterialFieldErrors(
  fieldErrors: FieldErrors,
): MaterialFieldMessages {
  const messages: MaterialFieldMessages = {};

  const nameErrors = fieldErrors.name;
  if (nameErrors?.length) {
    messages.name = nameErrors.includes("duplicate")
      ? DUPLICATE_NAME_MESSAGE
      : EMPTY_NAME_MESSAGE;
  }

  return messages;
}
