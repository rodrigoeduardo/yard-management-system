import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileHomeHeader } from "./mobile-header";

describe("MobileHomeHeader", () => {
  it("renders the app name and subtitle", () => {
    render(<MobileHomeHeader />);

    expect(screen.getByText("Pátio")).toBeInTheDocument();
    expect(screen.getByText("Controle de Estoque")).toBeInTheDocument();
  });

  it("renders a settings-style icon button", () => {
    render(<MobileHomeHeader />);

    expect(
      screen.getByRole("button", { name: "Configurações" }),
    ).toBeInTheDocument();
  });

  it("is hidden at md: and up", () => {
    const { container } = render(<MobileHomeHeader />);

    expect(container.firstElementChild?.className).toMatch(/\bmd:hidden\b/);
  });
});
