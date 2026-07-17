import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("links to the inventory page labeled Estoque", () => {
    expect(NAV_ITEMS).toContainEqual({ href: "/inventory", label: "Estoque" });
  });

  it("links to the new load page labeled Nova Carga", () => {
    expect(NAV_ITEMS).toContainEqual({ href: "/loads/new", label: "Nova Carga" });
  });

  it("links to the new removal page labeled Nova Remoção", () => {
    expect(NAV_ITEMS).toContainEqual({ href: "/removals/new", label: "Nova Remoção" });
  });

  it("contains exactly the three core function links", () => {
    expect(NAV_ITEMS).toHaveLength(3);
  });
});
