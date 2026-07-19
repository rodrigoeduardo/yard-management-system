import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadDetailModal } from "./load-detail-modal";
import type { StockRow } from "./stock-table";

const fetchLoadItems = vi.fn();

vi.mock("@/lib/actions/load-items", () => ({
  fetchLoadItems: (loadId: string) => fetchLoadItems(loadId),
}));

const LOAD: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  entryDate: "01/01/2026",
  nfWeight: "1000",
  material: "Sucata",
  itemCount: 1,
  remainingWeight: "250",
  finished: false,
};

describe("LoadDetailModal", () => {
  it("renders the NF weight and remaining weight with the kg unit", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(screen.getByText("1000 kg")).toBeInTheDocument();
    expect(screen.getByText("250 kg")).toBeInTheDocument();
  });

  it("renders each item's weight with the kg unit", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          status: "in_stock",
        },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("50 kg")).toBeInTheDocument();
    });
  });
});
