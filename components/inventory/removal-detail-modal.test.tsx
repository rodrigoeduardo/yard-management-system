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

  it("renders the header title as 'Remoção de {date}'", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    expect(
      screen.getByRole("heading", { name: "Remoção de 02/01/2026" }),
    ).toBeInTheDocument();
  });

  it("labels each item row 'Item {n} — {NF}', indexed by position", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
        },
        {
          id: "item-2",
          identifier: "Item 2 - NF-002",
          weight: "30",
          notaFiscal: "NF-002",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item 1 — NF-001")).toBeInTheDocument();
    });
    expect(screen.getByText("Item 2 — NF-002")).toBeInTheDocument();
  });

  it("renders each item's NF and weight in separate columns", async () => {
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
      expect(screen.getByText("Item 1 — NF-001")).toBeInTheDocument();
    });
    // The label ("Item 1 — NF-001") is one text node; the NF column renders
    // "NF-001" again on its own, as a separate, muted element.
    const nfColumn = screen.getByText("NF-001");
    expect(nfColumn).toBeInTheDocument();
    expect(nfColumn.className).toContain("text-muted-foreground");
    expect(screen.getByText("50 kg")).toBeInTheDocument();
  });

  it("widens the dialog to 600px on desktop widths", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const heading = screen.getByRole("heading", {
      name: "Remoção de 02/01/2026",
    });
    const dialogContent = heading.closest('[class*="rounded-[20px]"]');
    expect(dialogContent?.className).toContain("sm:max-w-[600px]");
  });
});
