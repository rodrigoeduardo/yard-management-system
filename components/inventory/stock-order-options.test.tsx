import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { STOCK_ORDER_OPTIONS } from "@/lib/inventory/stock-query";
import { StockOrderOptions } from "./stock-order-options";

describe("StockOrderOptions", () => {
  it("renders a row for every order key with an ascending and descending choice", () => {
    render(
      <StockOrderOptions order="entryDate" dir="desc" onSelect={vi.fn()} />,
    );

    for (const option of STOCK_ORDER_OPTIONS) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Crescente")).toHaveLength(
      STOCK_ORDER_OPTIONS.length,
    );
    expect(screen.getAllByText("Decrescente")).toHaveLength(
      STOCK_ORDER_OPTIONS.length,
    );
  });

  it("marks the active order/direction as pressed", () => {
    render(
      <StockOrderOptions order="nfWeight" dir="asc" onSelect={vi.fn()} />,
    );

    const nfWeightRow = screen.getByText("Peso da NF").closest("div");
    const ascButton = nfWeightRow
      ? within(nfWeightRow).getByText("Crescente")
      : null;
    expect(ascButton).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onSelect with the chosen key and direction", () => {
    const onSelect = vi.fn();
    render(<StockOrderOptions order="entryDate" dir="desc" onSelect={onSelect} />);

    const itemCountRow = screen.getByText("Qtd. de Itens").closest("div")!;
    fireEvent.click(within(itemCountRow).getByText("Crescente"));

    expect(onSelect).toHaveBeenCalledWith("itemCount", "asc");
  });
});
