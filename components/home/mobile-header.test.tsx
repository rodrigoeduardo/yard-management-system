import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock("@/app/login/actions", () => ({ logout }));

import { MobileHomeHeader } from "./mobile-header";

describe("MobileHomeHeader", () => {
  it("renders the app name and subtitle", () => {
    render(<MobileHomeHeader initials="RS" />);

    expect(screen.getByText("Pátio")).toBeInTheDocument();
    expect(screen.getByText("Controle de Estoque")).toBeInTheDocument();
  });

  it("renders the account initials", () => {
    render(<MobileHomeHeader initials="RS" />);

    expect(screen.getByText("RS")).toBeInTheDocument();
  });

  it("submits the logout server action from the Sair button", () => {
    render(<MobileHomeHeader initials="RS" />);

    const button = screen.getByRole("button", { name: "Sair" });
    expect(button.closest("form")).toHaveAttribute("action");
  });

  it("is hidden at md: and up", () => {
    const { container } = render(<MobileHomeHeader initials="RS" />);

    expect(container.firstElementChild?.className).toMatch(/\bmd:hidden\b/);
  });
});
