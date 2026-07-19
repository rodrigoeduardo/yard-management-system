import { describe, expect, it } from "vitest";
import { mapRemoveItemsFieldErrors } from "./remove-items-error-map";

describe("mapRemoveItemsFieldErrors", () => {
  it("maps a field with errors to a Portuguese message", () => {
    const messages = mapRemoveItemsFieldErrors({
      driver: ["String must contain at least 1 character(s)"],
    });

    expect(messages.driver).toBe("Informe o motorista.");
  });

  it("omits fields with no errors", () => {
    const messages = mapRemoveItemsFieldErrors({
      driver: ["required"],
    });

    expect(messages.exitDateTime).toBeUndefined();
  });

  it("maps every known field independently", () => {
    const messages = mapRemoveItemsFieldErrors({
      exitDateTime: ["invalid"],
      qrTokens: ["too small"],
    });

    expect(messages.exitDateTime).toBe(
      "Informe uma data e hora de saída válidas.",
    );
    expect(messages.qrTokens).toBe("Escaneie ao menos um item.");
  });

  it("returns an empty object when there are no field errors", () => {
    expect(mapRemoveItemsFieldErrors({})).toEqual({});
  });
});
