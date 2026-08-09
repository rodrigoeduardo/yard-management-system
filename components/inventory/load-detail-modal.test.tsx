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
  transportOrder: "OT-0001",
  driver: "João Silva",
  nfDate: "05/01/2026",
  entryDate: "01/01/2026",
  nfWeight: "1000",
  material: "Sucata",
  itemCount: 1,
  remainingWeight: "250",
  removedItemCount: 0,
  finished: false,
};

describe("LoadDetailModal", () => {
  it("renders the transport order and driver", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(screen.getByText("OT-0001")).toBeInTheDocument();
    expect(screen.getByText("João Silva")).toBeInTheDocument();
  });

  it("renders '—' for transport order and driver on a pre-existing load without throwing", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(
      <LoadDetailModal
        load={{ ...LOAD, transportOrder: "—", driver: "—" }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("renders both the NF date and the entry date, clearly labelled and distinct", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(screen.getByText("Data da Nota Fiscal")).toBeInTheDocument();
    expect(screen.getByText("05/01/2026")).toBeInTheDocument();
    expect(screen.getByText("Data de Entrada")).toBeInTheDocument();
    expect(screen.getByText("01/01/2026")).toBeInTheDocument();
  });

  it("renders the NF weight and remaining weight with the Ton unit", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(screen.getByText("1000 Ton")).toBeInTheDocument();
    expect(screen.getByText("250 Ton")).toBeInTheDocument();
  });

  it("renders each item's weight with the Ton unit", async () => {
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
      expect(screen.getByText("50 Ton")).toBeInTheDocument();
    });
  });

  it("labels each item row 'Item {n} — {material}', indexed by position", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", weight: "30", status: "removed" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Item 1 — Sucata")).toBeInTheDocument();
    });
    expect(screen.getByText("Item 2 — Sucata")).toBeInTheDocument();
  });

  it("colors 'Em estoque' status green and 'Removido' status red", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", weight: "30", status: "removed" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    const inStock = await screen.findByText("Em estoque");
    expect(inStock.className).toContain("text-success-foreground");

    const removed = screen.getByText("Removido");
    expect(removed.className).toContain("text-destructive");
  });

  it("renders the header title as 'Carga {NF}'", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(
      screen.getByRole("heading", { name: "Carga NF-001" }),
    ).toBeInTheDocument();
  });

  it("widens the dialog to 600px on desktop widths", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    const heading = screen.getByRole("heading", { name: "Carga NF-001" });
    const dialogContent = heading.closest('[class*="rounded-[20px]"]');
    expect(dialogContent?.className).toContain("sm:max-w-[600px]");
  });
});
