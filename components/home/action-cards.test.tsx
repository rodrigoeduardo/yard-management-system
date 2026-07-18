import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionCards } from "./action-cards";

describe("ActionCards", () => {
  it("renders a card per home entry point, each linking to its route", () => {
    render(<ActionCards />);

    const addLoad = screen.getByRole("link", { name: /Adicionar Carga/ });
    expect(addLoad).toHaveAttribute("href", "/loads/new");

    const removeLoad = screen.getByRole("link", { name: /Remover Carga/ });
    expect(removeLoad).toHaveAttribute("href", "/removals/new");

    const viewStock = screen.getByRole("link", { name: /Ver Estoque/ });
    expect(viewStock).toHaveAttribute("href", "/inventory");
  });

  it("renders each card's description text", () => {
    render(<ActionCards />);

    expect(
      screen.getByText("Registrar a entrada de uma nova carga por Nota Fiscal."),
    ).toBeInTheDocument();
  });

  it("renders the 'Ações' section label", () => {
    render(<ActionCards />);

    expect(screen.getByText("Ações")).toBeInTheDocument();
  });
});
