import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalOrderControl } from "./removal-order-control";

describe("RemovalOrderControl", () => {
  it("renders a single icon trigger identified by its aria-label", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Ordenar" })).toBeInTheDocument();
  });

  it("opens a modal titled 'Ordenar por' with order options when the trigger is clicked", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Ordenar por")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Qtd. de Itens" })).toBeInTheDocument();
  });

  it("calls onChange instantly on selection but keeps the modal open", () => {
    const onChange = vi.fn();
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(screen.getByRole("radio", { name: "Qtd. de Itens" }));

    expect(onChange).toHaveBeenCalledWith("itemCount", "desc");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the modal without changing state when Aplicar is clicked", () => {
    const onChange = vi.fn();
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets order/direction to the section default and closes when Limpar is clicked", () => {
    const onChange = vi.fn();
    render(<RemovalOrderControl order="itemCount" dir="asc" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onChange).toHaveBeenCalledWith("exitDate", "desc");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows no active-order badge for the default order/direction", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows an active-order badge when order or direction differs from the default", () => {
    render(<RemovalOrderControl order="itemCount" dir="asc" onChange={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
