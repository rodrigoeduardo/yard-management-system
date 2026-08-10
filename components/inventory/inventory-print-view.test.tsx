import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryPrintView } from "./inventory-print-view";
import type { InventoryPrintRemovalRow, InventoryPrintStockRow } from "./inventory-print-view";

const stockRows: InventoryPrintStockRow[] = [
  {
    id: "load-1",
    notaFiscal: "NF-100",
    entryDate: "05/03/2026 · 09:00",
    nfWeight: "12.5",
    material: "Aço",
    itemCount: 4,
    remainingWeight: "8.5",
    finished: false,
  },
];

const removalRows: InventoryPrintRemovalRow[] = [
  {
    id: "removal-1",
    exitDate: "06/03/2026 · 14:30",
    driver: "John Doe",
    vehiclePlate: "ABC1234",
    notasFiscais: "NF-100, NF-200",
    itemCount: 3,
    totalRemovedWeight: "4.0",
    cancelled: false,
  },
];

describe("InventoryPrintView", () => {
  it("renders both tables with the on-screen columns", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={stockRows}
        stockTotal={1}
        removalRows={removalRows}
        removalTotal={1}
        cap={500}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /estoque atual/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /histórico de remoções/i }),
    ).toBeInTheDocument();

    // Stock table columns
    expect(screen.getByText("NF")).toBeInTheDocument();
    expect(screen.getByText("Data de Entrada")).toBeInTheDocument();
    expect(screen.getByText("Peso da NF")).toBeInTheDocument();
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Qtd. de Itens")).toBeInTheDocument();
    expect(screen.getByText("Peso Restante")).toBeInTheDocument();

    // Removal table columns
    expect(screen.getByText("Data de Saída")).toBeInTheDocument();
    expect(screen.getByText("Motorista")).toBeInTheDocument();
    expect(screen.getByText("Placa")).toBeInTheDocument();
    expect(screen.getByText("Notas Fiscais")).toBeInTheDocument();
    expect(screen.getByText("Itens")).toBeInTheDocument();
    expect(screen.getByText("Peso Total Removido")).toBeInTheDocument();

    // Row data
    expect(screen.getByText("NF-100")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows the generation timestamp so a filed copy is dated", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={stockRows}
        stockTotal={1}
        removalRows={removalRows}
        removalTotal={1}
        cap={500}
      />,
    );

    expect(screen.getByText(/09\/08\/2026 · 15:00/)).toBeInTheDocument();
  });

  it("marks a cancelled removal", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={[]}
        stockTotal={0}
        removalRows={[{ ...removalRows[0], cancelled: true }]}
        removalTotal={1}
        cap={500}
      />,
    );

    expect(screen.getByText(/cancelada/i)).toBeInTheDocument();
  });

  it("marks a finished load's stock row", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={[{ ...stockRows[0], itemCount: 0, remainingWeight: "0", finished: true }]}
        stockTotal={1}
        removalRows={[]}
        removalTotal={0}
        cap={500}
      />,
    );

    expect(screen.getByText(/finalizad/i)).toBeInTheDocument();
  });

  it("shows no truncation note when the total is within the cap", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={stockRows}
        stockTotal={1}
        removalRows={removalRows}
        removalTotal={1}
        cap={500}
      />,
    );

    expect(screen.queryByText(/truncad/i)).not.toBeInTheDocument();
  });

  it("shows a truncation note per table when the total exceeds the cap", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={stockRows}
        stockTotal={620}
        removalRows={removalRows}
        removalTotal={1}
        cap={500}
      />,
    );

    expect(screen.getByText(/500.*620|620.*500/)).toBeInTheDocument();
  });

  it("shows empty-state text when a table has no rows", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory"
        stockRows={[]}
        stockTotal={0}
        removalRows={[]}
        removalTotal={0}
        cap={500}
      />,
    );

    expect(screen.getByText(/nenhuma carga/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhuma remo/i)).toBeInTheDocument();
  });

  it("renders a back link to the Estoque page preserving the current filters", () => {
    render(
      <InventoryPrintView
        generatedAt="09/08/2026 · 15:00"
        backHref="/inventory?stock_q=Aço"
        stockRows={stockRows}
        stockTotal={1}
        removalRows={removalRows}
        removalTotal={1}
        cap={500}
      />,
    );

    const link = screen.getByRole("link", { name: /voltar ao estoque/i });
    expect(link).toHaveAttribute("href", "/inventory?stock_q=Aço");
  });
});
