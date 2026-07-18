import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockTable, type StockRow } from "./stock-table";

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
  id: "2",
  notaFiscal: "NF-002",
  entryDate: "02/01/2026",
  nfWeight: "500,00 kg",
  material: "Papel",
  itemCount: 0,
  remainingWeight: "0,00 kg",
  finished: true,
};

describe("StockTable", () => {
  it("renders numeric columns with the mono font", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    expect(screen.getByText("1.000,00 kg").className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("4").className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("250,00 kg").className).toMatch(/\bfont-mono\b/);
  });

  it("does not show a Finalizada badge for an open row", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
  });

  it("shows a Finalizada badge and tints the row for a finished load", () => {
    render(<StockTable rows={[FINISHED_ROW]} />);

    const badge = screen.getByText("Finalizada");
    expect(badge.closest('[data-slot="badge"]')).toBeInTheDocument();

    const row = badge.closest('[data-slot="table-row"]');
    expect(row?.className).toMatch(/\bbg-success\/\d+\b/);
  });

  it("renders finished-row numeric values in the success color", () => {
    render(<StockTable rows={[FINISHED_ROW]} />);

    expect(screen.getByText("0").className).toMatch(/\btext-success-foreground\b/);
    expect(screen.getByText("0,00 kg").className).toMatch(
      /\btext-success-foreground\b/,
    );
  });
});
