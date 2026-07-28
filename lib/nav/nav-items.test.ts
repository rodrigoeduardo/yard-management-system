import { describe, expect, it } from "vitest";
import { APP_NAV_ITEMS, isNavItemActive } from "./nav-items";

describe("APP_NAV_ITEMS", () => {
  it("has exactly five items, in Início / Entrada / Saída / Estoque / Materiais order", () => {
    expect(APP_NAV_ITEMS.map((item) => item.mobileLabel)).toEqual([
      "Início",
      "Entrada",
      "Saída",
      "Estoque",
      "Materiais",
    ]);
  });

  it("uses the same labels for the desktop nav", () => {
    expect(APP_NAV_ITEMS.map((item) => item.desktopLabel)).toEqual([
      "Início",
      "Entrada",
      "Saída",
      "Estoque",
      "Materiais",
    ]);
  });

  it("links each item to its route", () => {
    expect(APP_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/loads/new",
      "/removals/new",
      "/inventory",
      "/materials",
    ]);
  });
});

describe("isNavItemActive", () => {
  const [home, loads, removals, inventory, materialsItem] = APP_NAV_ITEMS;

  it("marks Início active only on the exact root path", () => {
    expect(isNavItemActive("/", home)).toBe(true);
    expect(isNavItemActive("/inventory", home)).toBe(false);
  });

  it("marks Entrada active on /loads/new", () => {
    expect(isNavItemActive("/loads/new", loads)).toBe(true);
  });

  it("marks Entrada active on nested /loads routes like the QR print page", () => {
    expect(isNavItemActive("/loads/abc-123/print", loads)).toBe(true);
  });

  it("does not mark Entrada active on unrelated routes", () => {
    expect(isNavItemActive("/removals/new", loads)).toBe(false);
  });

  it("marks Saída active on /removals/new", () => {
    expect(isNavItemActive("/removals/new", removals)).toBe(true);
  });

  it("marks Estoque active on /inventory", () => {
    expect(isNavItemActive("/inventory", inventory)).toBe(true);
  });

  it("marks Materiais active on /materials", () => {
    expect(isNavItemActive("/materials", materialsItem)).toBe(true);
  });

  it("does not mark Materiais active on unrelated routes", () => {
    expect(isNavItemActive("/inventory", materialsItem)).toBe(false);
  });
});
