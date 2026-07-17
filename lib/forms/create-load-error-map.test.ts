import { describe, expect, it } from "vitest";
import { mapCreateLoadFieldErrors } from "./create-load-error-map";

describe("mapCreateLoadFieldErrors", () => {
  it("maps a field with errors to a Portuguese message", () => {
    const messages = mapCreateLoadFieldErrors({
      notaFiscal: ["String must contain at least 1 character(s)"],
    });

    expect(messages.notaFiscal).toBe("Informe a nota fiscal.");
  });

  it("omits fields with no errors", () => {
    const messages = mapCreateLoadFieldErrors({
      notaFiscal: ["required"],
    });

    expect(messages.material).toBeUndefined();
  });

  it("maps every known field independently", () => {
    const messages = mapCreateLoadFieldErrors({
      entryDate: ["invalid"],
      nfWeight: ["invalid"],
      material: ["required"],
      itemWeights: ["invalid"],
    });

    expect(messages.entryDate).toBe("Informe uma data de entrada válida.");
    expect(messages.nfWeight).toBe("Informe o peso da nota fiscal.");
    expect(messages.material).toBe("Informe o material.");
    expect(messages.itemWeights).toBe("Informe um peso válido para cada item.");
  });

  it("returns an empty object when there are no field errors", () => {
    expect(mapCreateLoadFieldErrors({})).toEqual({});
  });
});
