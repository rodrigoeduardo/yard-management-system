import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryView } from "./inventory-view";
import type { RemovalLogRow } from "./removal-log-table";
import type { StockRow } from "./stock-table";

const STOCK_ROW: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  entryDate: "01/01/2026",
  nfWeight: "1.000,00 kg",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 kg",
  finished: false,
};

const REMOVAL_ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

describe("InventoryView", () => {
  it("shows the Estoque Atual view by default", () => {
    render(
      <InventoryView stockRows={[STOCK_ROW]} removalRows={[REMOVAL_ROW]} />,
    );

    expect(screen.getAllByText("NF-001").length).toBeGreaterThan(0);
    expect(screen.queryByText("João")).not.toBeInTheDocument();
  });

  it("switches to the Remoções view when that segment is selected", () => {
    render(
      <InventoryView stockRows={[STOCK_ROW]} removalRows={[REMOVAL_ROW]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remoções" }));

    expect(screen.getAllByText("João").length).toBeGreaterThan(0);
  });

  it("renders a segmented control with both segments", () => {
    render(<InventoryView stockRows={[]} removalRows={[]} />);

    expect(
      screen.getByRole("button", { name: "Estoque Atual" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remoções" }),
    ).toBeInTheDocument();
  });
});
