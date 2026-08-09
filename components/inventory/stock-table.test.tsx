import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockTable, type StockRow } from "./stock-table";

const OPEN_ROW: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  transportOrder: "OT-0001",
  driver: "João Silva",
  entryDate: "01/01/2026",
  nfWeight: "1000",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250",
  removedItemCount: 0,
  finished: false,
};

const PARTIAL_ROW: StockRow = {
  id: "3",
  notaFiscal: "NF-003",
  transportOrder: "OT-0002",
  driver: "Maria Souza",
  entryDate: "03/01/2026",
  nfWeight: "800",
  material: "Ferro",
  itemCount: 4,
  remainingWeight: "160",
  removedItemCount: 6,
  finished: false,
};

const FINISHED_ROW: StockRow = {
  id: "2",
  notaFiscal: "NF-002",
  transportOrder: "OT-0001",
  driver: "João Silva",
  entryDate: "02/01/2026",
  nfWeight: "500",
  material: "Papel",
  itemCount: 0,
  remainingWeight: "0",
  removedItemCount: 10,
  finished: true,
};

describe("StockTable", () => {
  it("renders numeric columns with the mono font", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    expect(screen.getByText("1000 Ton").className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("4").className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("250 Ton").className).toMatch(/\bfont-mono\b/);
  });

  it("renders uppercase, letter-spaced column headers", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    expect(screen.getByText("NF").className).toMatch(/\buppercase\b/);
    expect(screen.getByText("Peso Restante").className).toMatch(/\buppercase\b/);
  });

  it("does not show a Finalizada badge for an open row", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();
  });

  it("does not show a Finalizada badge for a finished row, but tints the row red", () => {
    render(<StockTable rows={[FINISHED_ROW]} />);

    expect(screen.queryByText("Finalizada")).not.toBeInTheDocument();

    const row = screen.getByText("Papel").closest('[data-slot="table-row"]');
    expect(row?.className).toMatch(/\bbg-destructive\/\d+\b/);
  });

  it("renders finished-row item count and remaining weight in the destructive color, but not the NF weight", () => {
    render(<StockTable rows={[FINISHED_ROW]} />);

    expect(screen.getByText("0").className).toMatch(/\btext-destructive\b/);
    expect(screen.getByText("0 Ton").className).toMatch(/\btext-destructive\b/);
    expect(screen.getByText("500 Ton").className).not.toMatch(
      /\btext-destructive\b/,
    );
  });

  it("tints a row with no removals green", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    const row = screen.getByText("Sucata").closest('[data-slot="table-row"]');
    expect(row?.className).toMatch(/\bbg-success\/\d+\b/);
  });

  it("tints a partially-removed, unfinished row yellow", () => {
    render(<StockTable rows={[PARTIAL_ROW]} />);

    const row = screen.getByText("Ferro").closest('[data-slot="table-row"]');
    expect(row?.className).toMatch(/\bbg-warning\/\d+\b/);
    expect(row?.className).not.toMatch(/\bbg-success\/\d+\b/);
    expect(row?.className).not.toMatch(/\bbg-destructive\/\d+\b/);
  });

  it("still states item count and remaining weight in text for every tier", () => {
    render(<StockTable rows={[OPEN_ROW, PARTIAL_ROW, FINISHED_ROW]} />);

    expect(screen.getAllByText("4")).toHaveLength(2);
    expect(screen.getByText("250 Ton")).toBeInTheDocument();
    expect(screen.getByText("160 Ton")).toBeInTheDocument();
    expect(screen.getByText("0 Ton")).toBeInTheDocument();
  });

  it("truncates a long material name with an ellipsis and exposes the full value via title", () => {
    const longMaterial =
      "Sucata de Alumínio Estanhado com Revestimento Especial de Alta Resistência";
    render(
      <StockTable
        rows={[{ ...OPEN_ROW, material: longMaterial }]}
      />,
    );

    const materialText = screen.getByText(longMaterial);
    expect(materialText.className).toMatch(/\btruncate\b/);
    expect(materialText.getAttribute("title")).toBe(longMaterial);
  });

  it("wraps the table in a rounded, bordered card matching the design", () => {
    render(<StockTable rows={[OPEN_ROW]} />);

    const card = screen
      .getByText("NF")
      .closest('[data-slot="table-container"]')?.parentElement;
    expect(card?.getAttribute("data-slot")).toBe("card");
    expect(card?.className).toMatch(/\boverflow-hidden\b/);
  });
});
