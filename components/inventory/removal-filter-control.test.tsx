import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RemovalQueryState } from "@/lib/inventory/removal-query";
import { RemovalFilterControl } from "./removal-filter-control";

const DEFAULT_QUERY: RemovalQueryState = {
  q: "",
  order: "exitDate",
  dir: "desc",
  page: 1,
};

describe("RemovalFilterControl", () => {
  it("renders a single icon trigger identified by its aria-label", () => {
    render(
      <RemovalFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
  });

  it("shows no badge when no filter is active", () => {
    render(
      <RemovalFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows a badge with the active filter count on the trigger button", () => {
    render(
      <RemovalFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01", weightMax: "500" }}
        onApply={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("opens a modal with filter fields when the trigger is clicked", () => {
    render(
      <RemovalFilterControl query={DEFAULT_QUERY} onApply={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Filtros")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de saída - de")).toBeInTheDocument();
  });

  it("applies filters and closes the modal when submitted", () => {
    const onApply = vi.fn();
    render(
      <RemovalFilterControl query={DEFAULT_QUERY} onApply={onApply} onClear={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.change(screen.getByLabelText("Data de saída - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalledWith({
      dateFrom: "2026-01-01",
      dateTo: "",
      weightMin: "",
      weightMax: "",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clears filters and closes the modal when Limpar is clicked", () => {
    const onClear = vi.fn();
    render(
      <RemovalFilterControl
        query={{ ...DEFAULT_QUERY, dateFrom: "2026-01-01" }}
        onApply={vi.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
