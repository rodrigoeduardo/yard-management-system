import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalCard } from "./removal-card";
import type { RemovalLogRow } from "./removal-log-table";

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  vehiclePlate: "ABC1234",
  totalRemovedWeight: "100",
  notasFiscais: "NF-001",
  itemCount: 3,
};

describe("RemovalCard", () => {
  it("renders the removal's fields", () => {
    render(<RemovalCard row={ROW} />);

    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("ABC1234")).toBeInTheDocument();
    expect(screen.getByText("NF-001")).toBeInTheDocument();
    expect(screen.getByText("100 t")).toBeInTheDocument();
    expect(screen.getByText(/3 itens removidos/)).toBeInTheDocument();
  });

  it("renders an em dash for a legacy removal without a vehicle plate", () => {
    render(<RemovalCard row={{ ...ROW, vehiclePlate: "—" }} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the exit date and the removed weight with the mono font, weight in accent color", () => {
    render(<RemovalCard row={ROW} />);

    expect(screen.getByText("02/01/2026").className).toMatch(/\bfont-mono\b/);

    const weight = screen.getByText("100 t");
    expect(weight.className).toMatch(/\bfont-mono\b/);
    expect(weight.className).toMatch(/\btext-accent-foreground\b/);
  });

  it("calls onClick when the card is activated", () => {
    const onClick = vi.fn();
    render(<RemovalCard row={ROW} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledWith(ROW);
  });
});
