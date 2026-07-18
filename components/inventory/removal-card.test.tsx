import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalCard } from "./removal-card";
import type { RemovalLogRow } from "./removal-log-table";

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

describe("RemovalCard", () => {
  it("renders the removal's fields", () => {
    render(<RemovalCard row={ROW} />);

    expect(screen.getByText("02/01/2026")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("NF-001")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("100,00 kg")).toBeInTheDocument();
  });

  it("renders numeric fields with the mono font", () => {
    render(<RemovalCard row={ROW} />);

    expect(screen.getByText("100,00 kg").className).toMatch(/\bfont-mono\b/);
    expect(screen.getByText("3").className).toMatch(/\bfont-mono\b/);
  });

  it("calls onClick when the card is activated", () => {
    const onClick = vi.fn();
    render(<RemovalCard row={ROW} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledWith(ROW);
  });
});
