import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StockQueryState } from "@/lib/inventory/stock-query";
import { StockFilterControl } from "./stock-filter-control";

const DEFAULT_QUERY: StockQueryState = {
  q: "",
  order: "entryDate",
  dir: "desc",
  page: 1,
};

describe("StockFilterControl", () => {
  it("renders a single icon trigger identified by its aria-label", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
  });

  it("shows no badge when no filter is active", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows a badge with the active filter count on the trigger button", () => {
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01", weightMax: "500" }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("counts showFinished: false toward the active filter badge", () => {
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, showFinished: false }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("opens a modal with filter fields when the trigger is clicked", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de entrada - de")).toBeInTheDocument();
  });

  it("applies filters and closes the modal when submitted", () => {
    const onApply = vi.fn();
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.change(screen.getByLabelText("Data de entrada - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(onApply).toHaveBeenCalledWith({
      dateFrom: "2026-01-01",
      dateTo: "",
      weightMin: "",
      weightMax: "",
      showFinished: true,
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears filters and closes the modal when Limpar filtros is clicked", () => {
    const onClear = vi.fn();
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01" }}
        onApply={vi.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
