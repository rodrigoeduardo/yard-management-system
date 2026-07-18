import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock("@/app/login/actions", () => ({ logout }));

import { TopNav } from "./top-nav";

describe("TopNav", () => {
  it("renders the logo and the four desktop nav links", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav initials="RS" />);

    expect(screen.getByText("Pátio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Nova Carga" })).toHaveAttribute(
      "href",
      "/loads/new",
    );
    expect(screen.getByRole("link", { name: "Nova Remoção" })).toHaveAttribute(
      "href",
      "/removals/new",
    );
    expect(screen.getByRole("link", { name: "Estoque" })).toHaveAttribute(
      "href",
      "/inventory",
    );
  });

  it("highlights the active section with the accent-tint pill", () => {
    usePathname.mockReturnValue("/removals/new");
    render(<TopNav initials="RS" />);

    const activeLink = screen.getByRole("link", { name: "Nova Remoção" });
    expect(activeLink.className).toMatch(/\bbg-accent\b/);
    expect(activeLink.className).toMatch(/\btext-accent-foreground\b/);

    const inactiveLink = screen.getByRole("link", { name: "Estoque" });
    expect(inactiveLink.className).not.toMatch(/\bbg-accent\b/);
  });

  it("renders the avatar initials", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav initials="RS" />);

    expect(screen.getByText("RS")).toBeInTheDocument();
  });

  it("submits the logout server action from the Sair button", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav initials="RS" />);

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button.closest("form")).toHaveAttribute("action");
  });

  it("is hidden below md: and shown as a flex row at md: and up", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav initials="RS" />);

    expect(screen.getByRole("banner").className).toMatch(/\bhidden\b/);
    expect(screen.getByRole("banner").className).toMatch(/\bmd:flex\b/);
  });

  it("is excluded from print output (issue #95)", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav initials="RS" />);

    expect(screen.getByRole("banner").className).toMatch(/\bprint:hidden\b/);
  });
});
