import { describe, expect, it } from "vitest";
import {
  mapCreateLoadFieldErrors,
  mapCreateLoadItemCorridaErrors,
  mapCreateLoadItemWeightErrors,
} from "./create-load-error-map";

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
      entryDateTime: ["invalid"],
      nfDate: ["invalid"],
      nfWeight: ["invalid"],
      material: ["required"],
      transportOrder: ["required"],
      driver: ["required"],
    });

    expect(messages.entryDateTime).toBe(
      "Informe uma data e hora de entrada válidas.",
    );
    expect(messages.nfDate).toBe("Informe a data da nota fiscal.");
    expect(messages.nfWeight).toBe("Informe o peso da nota fiscal.");
    expect(messages.material).toBe("Informe o material.");
    expect(messages.transportOrder).toBe("Informe a ordem de transporte.");
    expect(messages.driver).toBe("Informe o motorista.");
  });

  it("returns an empty object when there are no field errors", () => {
    expect(mapCreateLoadFieldErrors({})).toEqual({});
  });
});

describe("mapCreateLoadItemWeightErrors", () => {
  it("maps an item-weight error to its own index", () => {
    const messages = mapCreateLoadItemWeightErrors({
      1: ["Number must be greater than 0"],
    });

    expect(messages[1]).toBe("Informe um peso válido para o item 2.");
  });

  it("omits indexes with no errors", () => {
    const messages = mapCreateLoadItemWeightErrors({
      1: ["invalid"],
    });

    expect(messages[0]).toBeUndefined();
  });

  it("maps multiple indexes independently", () => {
    const messages = mapCreateLoadItemWeightErrors({
      0: ["invalid"],
      2: ["invalid"],
    });

    expect(messages[0]).toBe("Informe um peso válido para o item 1.");
    expect(messages[2]).toBe("Informe um peso válido para o item 3.");
  });

  it("returns an empty object when there are no item-weight errors", () => {
    expect(mapCreateLoadItemWeightErrors({})).toEqual({});
  });
});

describe("mapCreateLoadItemCorridaErrors", () => {
  it("maps an item-corrida error to its own index", () => {
    const messages = mapCreateLoadItemCorridaErrors({
      1: ["String must contain at least 1 character(s)"],
    });

    expect(messages[1]).toBe("Informe a corrida do item 2.");
  });

  it("omits indexes with no errors", () => {
    const messages = mapCreateLoadItemCorridaErrors({
      1: ["invalid"],
    });

    expect(messages[0]).toBeUndefined();
  });

  it("maps multiple indexes independently", () => {
    const messages = mapCreateLoadItemCorridaErrors({
      0: ["invalid"],
      2: ["invalid"],
    });

    expect(messages[0]).toBe("Informe a corrida do item 1.");
    expect(messages[2]).toBe("Informe a corrida do item 3.");
  });

  it("returns an empty object when there are no item-corrida errors", () => {
    expect(mapCreateLoadItemCorridaErrors({})).toEqual({});
  });
});
