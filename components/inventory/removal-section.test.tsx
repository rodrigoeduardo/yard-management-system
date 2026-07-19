import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemovalSection } from "./removal-section";
import type { RemovalLogRow } from "./removal-log-table";

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

describe("RemovalSection", () => {
  it("renders the empty state with no rows", () => {
    render(<RemovalSection rows={[]} />);

    expect(
      screen.getByText("Nenhuma remoção registrada ainda."),
    ).toBeInTheDocument();
  });

  it("renders a mobile card list hidden at md: and a desktop table hidden below md:", () => {
    render(<RemovalSection rows={[ROW]} />);

    const occurrences = screen.getAllByText("João");
    expect(occurrences).toHaveLength(2);

    const cardList = occurrences[0].closest('[data-slot="card"]')?.parentElement;
    expect(cardList?.className).toMatch(/\bmd:hidden\b/);

    const tableWrapper = occurrences[1].closest(
      '[data-slot="table-container"]',
    )?.parentElement?.parentElement;
    expect(tableWrapper?.className).toMatch(/\bhidden\b/);
    expect(tableWrapper?.className).toMatch(/\bmd:block\b/);
  });
});
