import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadDetailModal } from "./load-detail-modal";
import type { StockRow } from "./stock-table";

const fetchLoadItems = vi.fn();
const fetchLoadForEdit = vi.fn();
const updateItemWeightAction = vi.fn();
const updateItemCorridaAction = vi.fn();
const updateLoadAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/actions/load-items", () => ({
  fetchLoadItems: (loadId: string) => fetchLoadItems(loadId),
  fetchLoadForEdit: (loadId: string) => fetchLoadForEdit(loadId),
}));

vi.mock("@/lib/actions/item-weight", () => ({
  updateItemWeightAction: (input: { itemId: string; weight: number }) =>
    updateItemWeightAction(input),
}));

vi.mock("@/lib/actions/item-corrida", () => ({
  updateItemCorridaAction: (input: { itemId: string; corrida: string }) =>
    updateItemCorridaAction(input),
}));

vi.mock("@/lib/actions/loads", () => ({
  updateLoadAction: (input: unknown) => updateLoadAction(input),
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

describe("LoadDetailModal — Editar corrida (#353)", () => {
  it("hides corrida edits while disabled and for removed items", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock", corrida: "C-1" },
        { id: "item-2", identifier: "Item 2 - NF-001", number: 2, weight: "30", status: "removed", corrida: "C-2" },
      ],
    });

    const { rerender } = render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} />,
    );

    await screen.findByText("Item 1 — Sucata");
    expect(screen.queryByRole("button", { name: "Editar corrida" })).not.toBeInTheDocument();

    rerender(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    expect(screen.getAllByRole("button", { name: "Editar corrida" })).toHaveLength(1);
  });

  it("shows both edit affordances when both flags are on, and only corrida when just FEATURE_LOAD_EDIT is on", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock", corrida: "C-1" },
      ],
    });

    const { rerender } = render(
      <LoadDetailModal
        load={LOAD}
        open
        onOpenChange={() => {}}
        loadEditEnabled
        itemWeightEditEnabled
      />,
    );

    await screen.findByText("Item 1 — Sucata");
    expect(screen.getByRole("button", { name: "Editar peso" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar corrida" })).toBeInTheDocument();

    rerender(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    expect(screen.queryByRole("button", { name: "Editar peso" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar corrida" })).toBeInTheDocument();
  });

  it("shows a PT-BR error and avoids the action for blank corrida input", async () => {
    fetchLoadItems.mockResolvedValue({
      success: true,
      items: [
        { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock", corrida: "C-1" },
      ],
    });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Editar corrida" }));
    fireEvent.change(screen.getByLabelText("Corrida do item 1"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar corrida" }));

    expect(updateItemCorridaAction).not.toHaveBeenCalled();
    expect(screen.getByText("Informe a corrida.")).toBeInTheDocument();
  });

  it("refreshes the modal data, shows the stale-label warning, and calls the action trimmed after a successful corrida edit", async () => {
    fetchLoadItems
      .mockResolvedValueOnce({
        success: true,
        items: [
          { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock", corrida: "C-1" },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        items: [
          { id: "item-1", identifier: "Item 1 - NF-001", number: 1, weight: "50", status: "in_stock", corrida: "C-2" },
        ],
      });
    updateItemCorridaAction.mockResolvedValue({ success: true, item: {} });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Editar corrida" }));
    fireEvent.change(screen.getByLabelText("Corrida do item 1"), {
      target: { value: "  C-2  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar corrida" }));

    await waitFor(() => {
      expect(updateItemCorridaAction).toHaveBeenCalledWith({
        itemId: "item-1",
        corrida: "C-2",
      });
    });
    await waitFor(() => expect(screen.getByText("C-2")).toBeInTheDocument());
    expect(
      screen.getByText(/etiquetas impressas desta carga ficaram desatualizadas/),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});

describe("LoadDetailModal — Editar carga (#352)", () => {
  const EDIT_LOAD = {
    id: "1",
    notaFiscal: "NF-001",
    transportOrder: "OT-0001",
    driver: "João Silva",
    nfDate: "2026-01-01",
    entryDate: new Date("2026-01-01T12:00:00Z"),
    nfWeight: "1000",
    materialId: "material-1",
    material: "Sucata",
    removedItemCount: 0,
  };

  it("hides the Editar carga button when the flag is disabled", () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });

    render(<LoadDetailModal load={LOAD} open onOpenChange={() => {}} />);

    expect(
      screen.queryByRole("button", { name: "Editar carga" }),
    ).not.toBeInTheDocument();
  });

  it("shows the Editar carga button and loads raw fields into the form when clicked", async () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });
    fetchLoadForEdit.mockResolvedValue({ success: true, load: EDIT_LOAD });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Editar carga" }),
    );

    await waitFor(() => {
      expect(fetchLoadForEdit).toHaveBeenCalledWith("1");
    });
    expect(
      await screen.findByDisplayValue("OT-0001"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
  });

  it("disables NF and Material with an explanation when the load has a removed item", async () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });
    fetchLoadForEdit.mockResolvedValue({
      success: true,
      load: { ...EDIT_LOAD, removedItemCount: 1 },
    });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Editar carga" }),
    );

    const nfInput = await screen.findByLabelText("Nota Fiscal");
    expect(nfInput).toBeDisabled();
    expect(
      screen.getByText(/Nota Fiscal e Material não podem ser alterados/),
    ).toBeInTheDocument();
  });

  it("saves the edited fields and shows the stale-label warning when NF or Material changed", async () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });
    fetchLoadForEdit.mockResolvedValue({ success: true, load: EDIT_LOAD });
    updateLoadAction.mockResolvedValue({
      success: true,
      load: { ...EDIT_LOAD, notaFiscal: "NF-002", labelStale: true },
    });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Editar carga" }),
    );
    await screen.findByDisplayValue("OT-0001");

    fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
      target: { value: "NF-002" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(updateLoadAction).toHaveBeenCalledWith(
        expect.objectContaining({ loadId: "1", notaFiscal: "NF-002" }),
      );
    });
    expect(
      await screen.findByText(/etiquetas impressas desta carga/),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("shows a PT-BR field error and does not exit edit mode on a validation failure", async () => {
    fetchLoadItems.mockResolvedValue({ success: true, items: [] });
    fetchLoadForEdit.mockResolvedValue({ success: true, load: EDIT_LOAD });
    updateLoadAction.mockResolvedValue({
      success: false,
      error: {
        formErrors: [],
        fieldErrors: { notaFiscal: ["Informe a nota fiscal."] },
      },
    });

    render(
      <LoadDetailModal load={LOAD} open onOpenChange={() => {}} loadEditEnabled />,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Editar carga" }),
    );
    await screen.findByDisplayValue("OT-0001");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Informe a nota fiscal."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });
});
