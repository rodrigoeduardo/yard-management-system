import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalDetailModal } from "./removal-detail-modal";
import type { RemovalLogRow } from "./removal-log-table";

const fetchRemovalItems = vi.fn();

vi.mock("@/lib/actions/removal-items", () => ({
  fetchRemovalItems: (removalId: string) => fetchRemovalItems(removalId),
}));

const REMOVAL: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100",
  notasFiscais: "NF-001",
  itemCount: 1,
};

describe("RemovalDetailModal", () => {
  it("renders the total removed weight with the kg unit", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    expect(screen.getByText("100 kg")).toBeInTheDocument();
  });

  it("renders each item's weight with the kg unit", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("50 kg")).toBeInTheDocument();
    });
  });
});
