import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockSection } from "./stock-section";
import type { StockRow } from "./stock-table";

const ROW: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  entryDate: "01/01/2026",
  nfWeight: "1.000,00 kg",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 kg",
  finished: false,
};

describe("StockSection", () => {
  it("renders the empty state with no rows", () => {
    render(<StockSection rows={[]} />);

    expect(screen.getByText("Nenhuma carga em estoque.")).toBeInTheDocument();
  });

  it("renders a mobile card list hidden at md: and a desktop table hidden below md:", () => {
    render(<StockSection rows={[ROW]} />);

    const occurrences = screen.getAllByText("NF-001");
    expect(occurrences).toHaveLength(2);

    const cardList = occurrences[0].closest('[data-slot="card"]')?.parentElement;
    expect(cardList?.className).toMatch(/\bmd:hidden\b/);

    const tableWrapper = occurrences[1].closest(
      '[data-slot="table-container"]',
    )?.parentElement;
    expect(tableWrapper?.className).toMatch(/\bhidden\b/);
    expect(tableWrapper?.className).toMatch(/\bmd:block\b/);
  });
});
