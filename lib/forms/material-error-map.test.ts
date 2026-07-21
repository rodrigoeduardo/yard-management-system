import { describe, expect, it } from "vitest";
import { mapMaterialFieldErrors } from "./material-error-map";

describe("mapMaterialFieldErrors", () => {
  it("maps an empty-name error to a Portuguese message", () => {
    const messages = mapMaterialFieldErrors({
      name: ["String must contain at least 1 character(s)"],
    });

    expect(messages.name).toBe("Informe o nome do material.");
  });

  it("maps a duplicate-name error to a distinct Portuguese message", () => {
    const messages = mapMaterialFieldErrors({
      name: ["duplicate"],
    });

    expect(messages.name).toBe("Já existe um material com esse nome.");
  });

  it("returns an empty object when there are no field errors", () => {
    expect(mapMaterialFieldErrors({})).toEqual({});
  });

  it("omits name when it has no errors", () => {
    const messages = mapMaterialFieldErrors({ name: [] });

    expect(messages.name).toBeUndefined();
  });
});
