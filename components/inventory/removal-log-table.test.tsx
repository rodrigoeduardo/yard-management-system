import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemovalLogTable, type RemovalLogRow } from "./removal-log-table";

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  vehiclePlate: "ABC1234",
  totalRemovedWeight: "100",
  notasFiscais: "NF-001",
  itemCount: 3,
  cancelled: false,
};

describe("RemovalLogTable", () => {
  it("renders all columns including item count", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("ABC1234")).toBeInTheDocument();
    expect(screen.getByText("NF-001")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("100 Ton")).toBeInTheDocument();
  });

  it("renders a Placa column header", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("Placa")).toBeInTheDocument();
  });

  it("renders an em dash for a legacy removal without a vehicle plate", () => {
    render(<RemovalLogTable rows={[{ ...ROW, vehiclePlate: "—" }]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders numeric columns with the mono font, the total weight in accent color", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("3").className).toMatch(/\bfont-mono\b/);

    const weight = screen.getByText("100 Ton");
    expect(weight.className).toMatch(/\bfont-mono\b/);
    expect(weight.className).toMatch(/\btext-accent-foreground\b/);
  });

  it("renders uppercase, letter-spaced column headers", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("Motorista").className).toMatch(/\buppercase\b/);
    expect(screen.getByText("Peso Total Removido").className).toMatch(
      /\buppercase\b/,
    );
  });

  it("truncates a long driver name and a long NF list with an ellipsis and exposes the full value via title", () => {
    const longDriver = "José Antônio da Silva Nascimento de Albuquerque Filho";
    const longNfs = "NF-001, NF-002, NF-003, NF-004, NF-005, NF-006, NF-007";
    render(
      <RemovalLogTable
        rows={[{ ...ROW, driver: longDriver, notasFiscais: longNfs }]}
      />,
    );

    const driverText = screen.getByText(longDriver);
    expect(driverText.className).toMatch(/\btruncate\b/);
    expect(driverText.getAttribute("title")).toBe(longDriver);

    const nfsText = screen.getByText(longNfs);
    expect(nfsText.className).toMatch(/\btruncate\b/);
    expect(nfsText.getAttribute("title")).toBe(longNfs);
  });

  it("wraps the table in a rounded, bordered card matching the design", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    const card = screen
      .getByText("Motorista")
      .closest('[data-slot="table-container"]')?.parentElement;
    expect(card?.getAttribute("data-slot")).toBe("card");
    expect(card?.className).toMatch(/\boverflow-hidden\b/);
  });

  it("sizes columns with proportional percentage widths that sum to 100%, not fixed pixel widths", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    const headers = [
      "Data de Saída",
      "Motorista",
      "Placa",
      "Notas Fiscais",
      "Itens",
      "Peso Total Removido",
    ].map((text) => screen.getByText(text));

    let total = 0;
    for (const header of headers) {
      expect(header.className).not.toMatch(/\bw-\[\d+px\]\b/);
      const match = header.className.match(/\bw-\[(\d+(?:\.\d+)?)%\]/);
      expect(match).not.toBeNull();
      total += Number(match?.[1]);
    }
    expect(total).toBe(100);
  });

  it("marks a cancelled removal's row as Cancelada (issue #310)", () => {
    render(<RemovalLogTable rows={[{ ...ROW, cancelled: true }]} />);

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("does not show a Cancelada marker for an active removal", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.queryByText("Cancelada")).not.toBeInTheDocument();
  });
});
