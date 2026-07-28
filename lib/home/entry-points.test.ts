import { describe, expect, it } from "vitest";
import { HOME_ENTRY_POINTS } from "./entry-points";

describe("HOME_ENTRY_POINTS", () => {
  it("links to the load creation page labeled Entrada", () => {
    expect(HOME_ENTRY_POINTS).toContainEqual(
      expect.objectContaining({ href: "/loads/new", label: "Entrada" }),
    );
  });

  it("links to the removal creation page labeled Saída", () => {
    expect(HOME_ENTRY_POINTS).toContainEqual(
      expect.objectContaining({ href: "/removals/new", label: "Saída" }),
    );
  });

  it("gives every entry point an icon", () => {
    for (const entryPoint of HOME_ENTRY_POINTS) {
      expect(entryPoint.icon).toBeDefined();
    }
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
