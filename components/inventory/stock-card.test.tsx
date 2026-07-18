import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockCard } from "./stock-card";
import type { StockRow } from "./stock-table";

const OPEN_ROW: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  entryDate: "01/01/2026",
  nfWeight: "1.000,00 kg",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 kg",
  finished: false,
};

const FINISHED_ROW: StockRow = {
  ...OPEN_ROW,
  id: "2",
  notaFiscal: "NF-002",
  itemCount: 0,
  remainingWeight: "0,00 kg",
  finished: true,
};

describe("StockCard", () => {
  it("renders the load's fields", () => {
    render(<StockCard row={OPEN_ROW} />);

    expect(screen.getByText("NF-001")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026")).toBeInTheDocument();
    expect(screen.getByText("1.000,00 kg")).toBeInTheDocument();
    expect(screen.getByText("Sucata")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("250,00 kg")).toBeInTheDocument();
  });

  it("calls onClick when the card is activated", () => {
    const onClick = vi.fn();
    render(<StockCard row={OPEN_ROW} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledWith(OPEN_ROW);
  });

  it("does not show a Finalizada badge or tint for an open load", () => {
    render(<StockCard row={OPEN_ROW} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
  });

  it("shows a Finalizada badge, tint, and green numerics for a finished load", () => {
    render(<StockCard row={FINISHED_ROW} />);

    const badge = screen.getByText("Finalizada");
    expect(badge.closest('[data-slot="badge"]')).toBeInTheDocument();

    const card = badge.closest('[data-slot="card"]');
    expect(card?.className).toMatch(/\bbg-success\/\d+\b/);

    expect(screen.getByText("0").className).toMatch(/\btext-success-foreground\b/);
    expect(screen.getByText("0,00 kg").className).toMatch(
      /\btext-success-foreground\b/,
    );
  });
});
