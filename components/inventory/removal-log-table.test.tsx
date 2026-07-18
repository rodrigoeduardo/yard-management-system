import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemovalLogTable, type RemovalLogRow } from "./removal-log-table";

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

describe("RemovalLogTable", () => {
  it("renders all columns including item count", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("NF-001")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("100,00 kg")).toBeInTheDocument();
  });

  it("renders numeric columns with the mono font, the total weight in accent color", () => {
    render(<RemovalLogTable rows={[ROW]} />);

    expect(screen.getByText("3").className).toMatch(/\bfont-mono\b/);

    const weight = screen.getByText("100,00 kg");
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
});
