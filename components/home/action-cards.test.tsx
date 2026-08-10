import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionCards } from "./action-cards";

describe("ActionCards", () => {
  it("renders a card per home entry point, each linking to its route", () => {
    render(<ActionCards />);

    const addLoad = screen.getByRole("link", { name: /Entrada/ });
    expect(addLoad).toHaveAttribute("href", "/loads/new");

    const removeLoad = screen.getByRole("link", { name: /Saída/ });
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

  it("hides Entrada and Saída for a viewer session, keeping Ver Estoque (issue #314)", () => {
    render(<ActionCards isViewer />);

    expect(screen.queryByRole("link", { name: /Entrada/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Saída/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver Estoque/ })).toBeInTheDocument();
  });

  it("shows every card for an operator session by default", () => {
    render(<ActionCards />);

    expect(screen.getByRole("link", { name: /Entrada/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Saída/ })).toBeInTheDocument();
  });
});
