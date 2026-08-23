import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadDetailModal } from "./load-detail-modal";
import type { StockRow } from "./stock-table";

const fetchLoadItems = vi.fn();
const updateItemWeightAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/actions/load-items", () => ({
  fetchLoadItems: (loadId: string) => fetchLoadItems(loadId),
}));

vi.mock("@/lib/actions/item-weight", () => ({
  updateItemWeightAction: (input: { itemId: string; weight: number }) =>
    updateItemWeightAction(input),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
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
          number: 1,
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

  it("labels each item row 'Item {n} — {material}' using the item's persisted number", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", number: 2, weight: "30", status: "removed" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Item 1 — Sucata")).toBeInTheDocument();
    });
    expect(screen.getByText("Item 2 — Sucata")).toBeInTheDocument();
  });

  it("shows each item's own corrida when present", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          number: 1,
          weight: "50",
          status: "in_stock",
          corrida: "C-4471",
        },
        {
          id: "item-2",
          identifier: "Item 2 - NF-001",
          number: 2,
          weight: "30",
          status: "removed",
          corrida: null,
        },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("C-4471")).toBeInTheDocument();
    });
  });

  it("renders no corrida text when the item's corrida is null", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          number: 1,
          weight: "50",
          status: "in_stock",
          corrida: null,
        },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Item 1 — Sucata")).toBeInTheDocument();
    });
    expect(screen.queryByText("null")).not.toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  it("renders each item's persisted number, not its position in the array", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 5 - NF-001", number: 5, weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", number: 2, weight: "30", status: "in_stock" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("Item 5 — Sucata")).toBeInTheDocument();
    });
    expect(screen.getByText("Item 2 — Sucata")).toBeInTheDocument();
    expect(screen.queryByText("Item 1 — Sucata")).not.toBeInTheDocument();
  });

  it("colors 'Em estoque' status green and 'Removido' status red", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", number: 2, weight: "30", status: "removed" },
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

  it("hides weight edits while disabled and for removed items", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
        { id: "item-2", identifier: "Item 2 - NF-001", number: 2, weight: "30", status: "removed" },
      ],
    });

    const { rerender } = render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} />,
    );

    await screen.findByText("Item 1 — Sucata");
    expect(screen.queryByRole("button", { name: "Editar peso" })).not.toBeInTheDocument();

    rerender(
      <LoadDetailModal
        load={LOAD}
        open
        onOpenChange={() => {}}
        itemWeightEditEnabled
      />,
    );

    expect(screen.getAllByRole("button", { name: "Editar peso" })).toHaveLength(1);
  });

  it("shows a PT-BR error and avoids the action for invalid weight input", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
      ],
    });

    render(
      <LoadDetailModal
        load={LOAD}
        open
        onOpenChange={() => {}}
        itemWeightEditEnabled
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Editar peso" }));
    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar peso" }));

    expect(updateItemWeightAction).not.toHaveBeenCalled();
    expect(screen.getByText("Informe um peso maior que zero.")).toBeInTheDocument();
  });

  it("shows labeled Peso and Status fields for the mobile stacked layout", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    await screen.findByText("Item 1 — Sucata");
    expect(screen.getByText("Peso")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("labels the corrida value for an item that has one", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          number: 1,
          weight: "50",
          status: "in_stock",
          corrida: "C-4471",
        },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    const corrida = await screen.findByText("C-4471");
    expect(corrida.parentElement?.textContent).toContain("Corrida");
  });

  it("stacks the item row as a single column below md and restores the fixed grid at md and above", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock" },
      ],
    });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    const row = (await screen.findByText("Item 1 — Sucata")).closest("li");
    const grid = row?.firstElementChild;
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("md:grid-cols-[1fr_110px_110px]");
  });

  it("refreshes the modal data and inventory after a successful weight edit", async () => {
    fetchLoadItems
      .mockResolvedValueOnce({
        success: true,
        items: [
          { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "2", status: "in_stock" },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        items: [
          { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "2.35", status: "in_stock" },
        ],
      });
    updateItemWeightAction.mockResolvedValue({ success: true, item: {} });

    render(
      <LoadDetailModal
        load={LOAD}
        open
        onOpenChange={() => {}}
        itemWeightEditEnabled
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Editar peso" }));
    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "2.35" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar peso" }));

    await waitFor(() => {
      expect(updateItemWeightAction).toHaveBeenCalledWith({
        itemId: "item-1",
        weight: 2.35,
      });
    });
    await waitFor(() => expect(screen.getByText("2.35 Ton")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalled();
  });
});
