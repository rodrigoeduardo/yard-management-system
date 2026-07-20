import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STOCK_ORDER_OPTIONS } from "@/lib/inventory/stock-query";
import { StockOrderOptions } from "./stock-order-options";

describe("StockOrderOptions", () => {
  it("renders a radio row for every order key", () => {
    render(
      <StockOrderOptions
        order="entryDate"
        dir="desc"
        onSelect={vi.fn()}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    for (const option of STOCK_ORDER_OPTIONS) {
      expect(screen.getByRole("radio", { name: option.label })).toBeInTheDocument();
    }
  });

  it("checks the selected field's radio and shows its direction chips only on that row", () => {
    render(
      <StockOrderOptions
        order="nfWeight"
        dir="asc"
        onSelect={vi.fn()}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Peso da NF" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.getByRole("radio", { name: "Data de Entrada" }),
    ).toHaveAttribute("aria-checked", "false");

    const nfWeightRow = screen.getByRole("radio", { name: "Peso da NF" });
    expect(within(nfWeightRow).getByText("Asc ↑")).toBeInTheDocument();
    expect(within(nfWeightRow).getByText("Desc ↓")).toBeInTheDocument();

    const entryDateRow = screen.getByRole("radio", { name: "Data de Entrada" });
    expect(within(entryDateRow).queryByText("Asc ↑")).not.toBeInTheDocument();
    expect(within(entryDateRow).queryByText("Desc ↓")).not.toBeInTheDocument();
  });

  it("calls onSelect with the current direction when an unselected field row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <StockOrderOptions
        order="entryDate"
        dir="desc"
        onSelect={onSelect}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Peso da NF" }));

    expect(onSelect).toHaveBeenCalledWith("nfWeight", "desc");
  });

  it("calls onSelect with the chosen direction when a chip on the selected row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <StockOrderOptions
        order="entryDate"
        dir="desc"
        onSelect={onSelect}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const entryDateRow = screen.getByRole("radio", { name: "Data de Entrada" });
    fireEvent.click(within(entryDateRow).getByText("Asc ↑"));

    expect(onSelect).toHaveBeenCalledWith("entryDate", "asc");
  });

  it("calls onApply when the Aplicar button is clicked", () => {
    const onApply = vi.fn();
    render(
      <StockOrderOptions
        order="entryDate"
        dir="desc"
        onSelect={vi.fn()}
        onApply={onApply}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalled();
  });

  it("calls onClear when the Limpar button is clicked", () => {
    const onClear = vi.fn();
    render(
      <StockOrderOptions
        order="nfWeight"
        dir="asc"
        onSelect={vi.fn()}
        onApply={vi.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onClear).toHaveBeenCalled();
  });
});
