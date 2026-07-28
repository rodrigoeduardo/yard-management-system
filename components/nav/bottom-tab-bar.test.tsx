import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import { BottomTabBar } from "./bottom-tab-bar";

describe("BottomTabBar", () => {
  it("renders the five mobile nav labels", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabBar />);

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Saída")).toBeInTheDocument();
    expect(screen.getByText("Estoque")).toBeInTheDocument();
    expect(screen.getByText("Materiais")).toBeInTheDocument();
  });

  it("links each item to its route", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabBar />);

    expect(screen.getByRole("link", { name: /Entrada/ })).toHaveAttribute(
      "href",
      "/loads/new",
    );
    expect(screen.getByRole("link", { name: /Saída/ })).toHaveAttribute(
      "href",
      "/removals/new",
    );
    expect(screen.getByRole("link", { name: /Materiais/ })).toHaveAttribute(
      "href",
      "/materials",
    );
  });

  it("highlights the active section with the accent-tint pill behind the icon", () => {
    usePathname.mockReturnValue("/inventory");
    render(<BottomTabBar />);

    const activeLink = screen.getByRole("link", { name: /Estoque/ });
    expect(activeLink.className).toMatch(/\btext-accent-foreground\b/);
    expect(activeLink.querySelector("span")?.className).toMatch(/\bbg-accent\b/);

    const inactiveLink = screen.getByRole("link", { name: /Início/ });
    expect(inactiveLink.className).not.toMatch(/\btext-accent-foreground\b/);
    expect(inactiveLink.querySelector("span")?.className).not.toMatch(/\bbg-accent\b/);
  });

  it("marks Entrada active for nested /loads routes", () => {
    usePathname.mockReturnValue("/loads/abc-123/print");
    render(<BottomTabBar />);

    const activeLink = screen.getByRole("link", { name: /Entrada/ });
    expect(activeLink.querySelector("span")?.className).toMatch(/\bbg-accent\b/);
  });

  it("is fixed to the bottom of the viewport and hidden at md:", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabBar />);

    expect(screen.getByRole("navigation").className).toMatch(/\bfixed\b/);
    expect(screen.getByRole("navigation").className).toMatch(/\bmd:hidden\b/);
  });

  it("is excluded from print output (issue #95)", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabBar />);

    expect(screen.getByRole("navigation").className).toMatch(/\bprint:hidden\b/);
  });
});
