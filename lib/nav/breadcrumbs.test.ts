import { describe, expect, it } from "vitest";
import { buildTrail, HOME_CRUMB } from "./breadcrumbs";

describe("HOME_CRUMB", () => {
  it("links to the root path labeled Início", () => {
    expect(HOME_CRUMB).toEqual({ href: "/", label: "Início" });
  });
});

describe("buildTrail", () => {
  it("prepends the home crumb to a single ancestor", () => {
    expect(buildTrail({ href: "/loads/new", label: "Nova Carga" })).toEqual([
      HOME_CRUMB,
      { href: "/loads/new", label: "Nova Carga" },
    ]);
  });

  it("preserves order across multiple ancestor crumbs", () => {
    const trail = buildTrail(
      { href: "/inventory", label: "Estoque" },
      { href: "/loads/abc/print", label: "Imprimir QR Codes" },
    );

    expect(trail).toEqual([
      HOME_CRUMB,
      { href: "/inventory", label: "Estoque" },
      { href: "/loads/abc/print", label: "Imprimir QR Codes" },
    ]);
  });
});
