import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockCard } from "./stock-card";
import type { StockRow } from "./stock-table";

const OPEN_ROW: StockRow = {
  id: "1",
  notaFiscal: "145.812",
  entryDate: "01/01/2026",
  nfWeight: "1000",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250",
  finished: false,
};

const FINISHED_ROW: StockRow = {
  ...OPEN_ROW,
  id: "2",
  notaFiscal: "145.813",
  itemCount: 0,
  remainingWeight: "0",
  finished: true,
};

describe("StockCard", () => {
  it("renders the load's fields", () => {
    render(<StockCard row={OPEN_ROW} />);

    expect(screen.getByText("NF 145.812")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026")).toBeInTheDocument();
    expect(screen.getByText("1000 Ton")).toBeInTheDocument();
    expect(screen.getByText("Material: Sucata")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("250 Ton")).toBeInTheDocument();
  });

  it("calls onClick when the card is activated", () => {
    const onClick = vi.fn();
    render(<StockCard row={OPEN_ROW} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledWith(OPEN_ROW);
  });

  it("does not show a Finalizada badge, tint, or footer note for an open load", () => {
    render(<StockCard row={OPEN_ROW} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
    expect(screen.queryByText(/estoque desta carga finalizado/)).not.toBeInTheDocument();
    expect(screen.getByText("Material: Sucata")).toBeInTheDocument();
  });

  it("does not show a Finalizada badge but shows a red border tint and a footer note for a finished load", () => {
    render(<StockCard row={FINISHED_ROW} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();

    const card = screen
      .getByText("Material: Sucata · estoque desta carga finalizado")
      .closest('[data-slot="card"]');
    expect(card?.className).toMatch(/\bbg-destructive\/\d+\b/);
    expect(card?.className).toMatch(/\bborder-destructive\b/);
  });

  it("highlights item count and remaining weight in red when finished, but not the NF weight", () => {
    render(<StockCard row={FINISHED_ROW} />);

    expect(screen.getByText("0").className).toMatch(/\btext-destructive\b/);
    expect(screen.getByText("0 Ton").className).toMatch(/\btext-destructive\b/);
    expect(screen.getByText("1000 Ton").className).not.toMatch(
      /\btext-destructive\b/,
    );
  });
});
