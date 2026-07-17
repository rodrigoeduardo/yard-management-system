import { describe, expect, it } from "vitest";
import { HOME_ENTRY_POINTS } from "./entry-points";

describe("HOME_ENTRY_POINTS", () => {
  it("links to the load creation page labeled Adicionar Carga", () => {
    expect(HOME_ENTRY_POINTS).toContainEqual(
      expect.objectContaining({ href: "/loads/new", label: "Adicionar Carga" }),
    );
  });

  it("links to the removal creation page labeled Nova Remoção", () => {
    expect(HOME_ENTRY_POINTS).toContainEqual(
      expect.objectContaining({ href: "/removals/new", label: "Nova Remoção" }),
    );
  });

  it("links to the inventory page labeled Ver Estoque", () => {
    expect(HOME_ENTRY_POINTS).toContainEqual(
      expect.objectContaining({ href: "/inventory", label: "Ver Estoque" }),
    );
  });

  it("contains exactly the three core function entry points", () => {
    expect(HOME_ENTRY_POINTS).toHaveLength(3);
  });
});
