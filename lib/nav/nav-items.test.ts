import { describe, expect, it } from "vitest";
import { APP_NAV_ITEMS, isNavItemActive } from "./nav-items";

describe("APP_NAV_ITEMS", () => {
  it("has exactly four items, in Início / Carga / Remoção / Estoque order", () => {
    expect(APP_NAV_ITEMS.map((item) => item.mobileLabel)).toEqual([
      "Início",
      "Carga",
      "Remoção",
      "Estoque",
    ]);
  });

  it("uses the full desktop labels for Carga and Remoção", () => {
    expect(APP_NAV_ITEMS.map((item) => item.desktopLabel)).toEqual([
      "Início",
      "Nova Carga",
      "Nova Remoção",
      "Estoque",
    ]);
  });

  it("links each item to its route", () => {
    expect(APP_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/",
      "/loads/new",
      "/removals/new",
      "/inventory",
    ]);
  });
});

describe("isNavItemActive", () => {
  const [home, loads, removals, inventory] = APP_NAV_ITEMS;

  it("marks Início active only on the exact root path", () => {
    expect(isNavItemActive("/", home)).toBe(true);
    expect(isNavItemActive("/inventory", home)).toBe(false);
  });

  it("marks Carga active on /loads/new", () => {
    expect(isNavItemActive("/loads/new", loads)).toBe(true);
  });

  it("marks Carga active on nested /loads routes like the QR print page", () => {
    expect(isNavItemActive("/loads/abc-123/print", loads)).toBe(true);
  });

  it("does not mark Carga active on unrelated routes", () => {
    expect(isNavItemActive("/removals/new", loads)).toBe(false);
  });

  it("marks Remoção active on /removals/new", () => {
    expect(isNavItemActive("/removals/new", removals)).toBe(true);
  });

  it("marks Estoque active on /inventory", () => {
    expect(isNavItemActive("/inventory", inventory)).toBe(true);
  });
});
