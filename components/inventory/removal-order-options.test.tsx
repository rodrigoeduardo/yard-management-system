import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { REMOVAL_ORDER_OPTIONS } from "@/lib/inventory/removal-query";
import { RemovalOrderOptions } from "./removal-order-options";

describe("RemovalOrderOptions", () => {
  it("renders a radio row for every order key", () => {
    render(
      <RemovalOrderOptions
        order="exitDate"
        dir="desc"
        onSelect={vi.fn()}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    for (const option of REMOVAL_ORDER_OPTIONS) {
      expect(screen.getByRole("radio", { name: option.label })).toBeInTheDocument();
    }
  });

  it("checks the selected field's radio and shows its direction chips only on that row", () => {
    render(
      <RemovalOrderOptions
        order="itemCount"
        dir="asc"
        onSelect={vi.fn()}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Qtd. de Itens" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Data de Saída" })).toHaveAttribute(
      "aria-checked",
      "false",
    );

    const itemCountRow = screen.getByRole("radio", { name: "Qtd. de Itens" });
    expect(within(itemCountRow).getByText("Asc ↑")).toBeInTheDocument();
    expect(within(itemCountRow).getByText("Desc ↓")).toBeInTheDocument();

    const exitDateRow = screen.getByRole("radio", { name: "Data de Saída" });
    expect(within(exitDateRow).queryByText("Asc ↑")).not.toBeInTheDocument();
    expect(within(exitDateRow).queryByText("Desc ↓")).not.toBeInTheDocument();
  });

  it("calls onSelect with the current direction when an unselected field row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <RemovalOrderOptions
        order="exitDate"
        dir="desc"
        onSelect={onSelect}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Qtd. de Itens" }));

    expect(onSelect).toHaveBeenCalledWith("itemCount", "desc");
  });

  it("calls onSelect with the chosen direction when a chip on the selected row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <RemovalOrderOptions
        order="exitDate"
        dir="desc"
        onSelect={onSelect}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const exitDateRow = screen.getByRole("radio", { name: "Data de Saída" });
    fireEvent.click(within(exitDateRow).getByText("Asc ↑"));

    expect(onSelect).toHaveBeenCalledWith("exitDate", "asc");
  });

  it("calls onApply when the Aplicar button is clicked", () => {
    const onApply = vi.fn();
    render(
      <RemovalOrderOptions
        order="exitDate"
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
      <RemovalOrderOptions
        order="itemCount"
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
