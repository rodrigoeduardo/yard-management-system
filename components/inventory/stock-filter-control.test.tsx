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
  it("renders a mobile trigger hidden at md: and a desktop trigger hidden below md:", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    const triggers = screen.getAllByRole("button", { name: "Filtros" });
    expect(triggers).toHaveLength(2);
    expect(triggers[0].closest("div")?.className).toMatch(/\bmd:hidden\b/);
    expect(triggers[1].closest("div")?.className).toMatch(/\bmd:block\b/);
  });

  it("shows no badge count when no filter is active", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.getAllByRole("button", { name: "Filtros" })).toHaveLength(2);
  });

  it("shows a badge with the active filter count on the trigger button", () => {
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01", weightMax: "500" }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Filtros (2)" })).toHaveLength(2);
  });

  it("counts showFinished: false toward the active filter badge", () => {
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, showFinished: false }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Filtros (1)" })).toHaveLength(2);
  });

  it("opens a dialog with filter fields when the mobile trigger is clicked", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de entrada - de")).toBeInTheDocument();
  });

  it("applies filters and closes the dialog when submitted on mobile", () => {
    const onApply = vi.fn();
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros" })[0]);
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

  it("clears filters and closes the dialog when Limpar filtros is clicked on mobile", () => {
    const onClear = vi.fn();
    render(
      <StockFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01" }}
        onApply={vi.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros (1)" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("expands an inline panel (no dialog) when the desktop trigger is clicked", () => {
    render(
      <StockFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    const desktopTrigger = screen.getAllByRole("button", { name: "Filtros" })[1];
    expect(desktopTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(desktopTrigger);

    expect(desktopTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar filtros" })).toBeInTheDocument();
  });
});
