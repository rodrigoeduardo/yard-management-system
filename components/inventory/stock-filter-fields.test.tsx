import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StockQueryState } from "@/lib/inventory/stock-query";
import { StockFilterFields } from "./stock-filter-fields";

const DEFAULT_QUERY: StockQueryState = {
  q: "",
  order: "entryDate",
  dir: "desc",
  page: 1,
};

describe("StockFilterFields", () => {
  it("pre-fills inputs from the current query state", () => {
    render(
      <StockFilterFields
        query={{
          ...DEFAULT_QUERY,
          dateFrom: "2026-01-01",
          dateTo: "2026-01-31",
          weightMin: "10",
          weightMax: "500",
        }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Data de entrada - de")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Data de entrada - até")).toHaveValue("2026-01-31");
    expect(screen.getByLabelText("Peso restante - mínimo")).toHaveValue(10);
    expect(screen.getByLabelText("Peso restante - máximo")).toHaveValue(500);
  });

  it("submits an only-from date filter", () => {
    const onApply = vi.fn();
    render(
      <StockFilterFields query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("Data de entrada - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalledWith({
      dateFrom: "2026-01-01",
      dateTo: "",
      weightMin: "",
      weightMax: "",
      showFinished: true,
    });
  });

  it("shows the 'Mostrar cargas finalizadas' checkbox checked by default", () => {
    render(
      <StockFilterFields query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Mostrar cargas finalizadas" }),
    ).toBeChecked();
  });

  it("unchecks the checkbox when query.showFinished is false", () => {
    render(
      <StockFilterFields
        query={{ ...DEFAULT_QUERY, showFinished: false }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Mostrar cargas finalizadas" }),
    ).not.toBeChecked();
  });

  it("submits showFinished: false when the checkbox is unchecked", () => {
    const onApply = vi.fn();
    render(
      <StockFilterFields query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Mostrar cargas finalizadas" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalledWith({
      dateFrom: "",
      dateTo: "",
      weightMin: "",
      weightMax: "",
      showFinished: false,
    });
  });

  it("submits a weight range filter (both bounds)", () => {
    const onApply = vi.fn();
    render(
      <StockFilterFields query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("Peso restante - mínimo"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Peso restante - máximo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalledWith({
      dateFrom: "",
      dateTo: "",
      weightMin: "10",
      weightMax: "500",
      showFinished: true,
    });
  });

  it("resets every field to empty and the checkbox to checked, and calls onClear, when Limpar is clicked", () => {
    const onClear = vi.fn();
    render(
      <StockFilterFields
        query={{
          ...DEFAULT_QUERY,
          dateFrom: "2026-01-01",
          weightMin: "10",
          showFinished: false,
        }}
        onApply={vi.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onClear).toHaveBeenCalled();
    expect(screen.getByLabelText("Data de entrada - de")).toHaveValue("");
    expect(screen.getByLabelText("Peso restante - mínimo")).toHaveValue(null);
    expect(
      screen.getByRole("checkbox", { name: "Mostrar cargas finalizadas" }),
    ).toBeChecked();
  });
});
