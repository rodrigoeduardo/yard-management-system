import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalDetailModal } from "./removal-detail-modal";
import type { RemovalLogRow } from "./removal-log-table";

const fetchRemovalItems = vi.fn();
const cancelRemovalAction = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/actions/removal-items", () => ({
  fetchRemovalItems: (removalId: string) => fetchRemovalItems(removalId),
}));

vi.mock("@/lib/actions/removal-cancel", () => ({
  cancelRemovalAction: (removalId: string) => cancelRemovalAction(removalId),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const REMOVAL: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  vehiclePlate: "ABC1234",
  totalRemovedWeight: "100",
  notasFiscais: "NF-001",
  itemCount: 1,
  cancelled: false,
};

describe("RemovalDetailModal", () => {
  it("renders the total removed weight with the Ton unit", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    expect(screen.getByText("100 Ton")).toBeInTheDocument();
  });

  it("renders each item's weight with the Ton unit", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "Aço",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("50 Ton")).toBeInTheDocument();
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

  it("labels each item row with its real per-load identifier, not its position in the list", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 7 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "Aço",
        },
        {
          id: "item-2",
          identifier: "Item 3 - NF-002",
          weight: "30",
          notaFiscal: "NF-002",
          material: "Cobre",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item 7 - NF-001")).toBeInTheDocument();
    });
    expect(screen.getByText("Item 3 - NF-002")).toBeInTheDocument();
  });

  it("renders each item's identifier and material in separate columns, with the NF appearing exactly once", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 7 - NF-123",
          weight: "50",
          notaFiscal: "NF-123",
          material: "Aço",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item 7 - NF-123")).toBeInTheDocument();
    });
    expect(screen.getByText("Aço")).toBeInTheDocument();
    expect(screen.getByText("50 Ton")).toBeInTheDocument();

    const row = screen.getByText("Item 7 - NF-123").closest("li");
    expect(row?.textContent?.match(/NF-123/g)).toHaveLength(1);
  });

  it("renders the row with three columns even when the item's material is missing", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const row = await waitFor(() =>
      screen.getByText("Item 1 - NF-001").closest("li"),
    );
    expect(row?.children).toHaveLength(3);
  });

  it("shows labeled Material and Peso fields for the mobile stacked layout", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "Aço",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item 1 - NF-001")).toBeInTheDocument();
    });
    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Peso")).toBeInTheDocument();
  });

  it("stacks the item row as a single column below md and restores the fixed grid at md and above", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "Aço",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const row = await waitFor(() =>
      screen.getByText("Item 1 - NF-001").closest("li"),
    );
    expect(row?.className).toContain("grid-cols-1");
    expect(row?.className).toContain("md:grid-cols-[1fr_110px_110px]");
  });

  it("renders the vehicle plate", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    expect(screen.getByText("ABC1234")).toBeInTheDocument();
  });

  it("renders an em dash for a legacy removal without a vehicle plate", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal
        removal={{ ...REMOVAL, vehiclePlate: "—" }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("links to the printable receipt for this removal (#270)", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const link = screen.getByRole("link", { name: /comprovante/i });
    expect(link).toHaveAttribute("href", "/removals/r1/receipt");
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

  it("caps the item list wrapper's height and makes it scrollable (#287)", async () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const wrapper = await waitFor(
      () =>
        screen.getByText("Nenhum item encontrado para esta remoção.")
          .parentElement,
    );
    expect(wrapper?.className).toContain("max-h-64");
    expect(wrapper?.className).toContain("overflow-y-auto");
  });

  it("keeps the scroll wrapper classes even with few items (cap, not conditional) (#287)", async () => {
    fetchRemovalItems.mockResolvedValue({
      success: true,
      items: [
        {
          id: "item-1",
          identifier: "Item 1 - NF-001",
          weight: "50",
          notaFiscal: "NF-001",
          material: "Aço",
        },
      ],
    });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Item 1 - NF-001")).toBeInTheDocument();
    });

    const wrapper = screen.getByText("Item 1 - NF-001").closest("ul")
      ?.parentElement;
    expect(wrapper?.className).toContain("max-h-64");
    expect(wrapper?.className).toContain("overflow-y-auto");
  });

  it("renders the loading state inside the scroll wrapper (#287)", () => {
    fetchRemovalItems.mockResolvedValue(new Promise(() => {}));

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const wrapper = screen.getByText("Carregando itens...").parentElement;
    expect(wrapper?.className).toContain("max-h-64");
    expect(wrapper?.className).toContain("overflow-y-auto");
  });

  it("renders an aria-hidden icon before the receipt link's label without changing its accessible name (#287)", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    const link = screen.getByRole("link", { name: "Comprovante de Remoção" });
    expect(link).toHaveAttribute("href", "/removals/r1/receipt");

    const icon = link.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});

describe("RemovalDetailModal cancellation (issue #310)", () => {
  it("shows no cancellation control when removalCancelEnabled is not passed (flag off)", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal removal={REMOVAL} open onOpenChange={() => {}} />,
    );

    expect(screen.queryByText("Cancelar remoção")).not.toBeInTheDocument();
  });

  it("shows a Cancelar remoção control when removalCancelEnabled is true and the removal is active", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal
        removal={REMOVAL}
        open
        onOpenChange={() => {}}
        removalCancelEnabled
      />,
    );

    expect(screen.getByText("Cancelar remoção")).toBeInTheDocument();
  });

  it("requires an explicit confirmation step before calling cancelRemovalAction", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal
        removal={REMOVAL}
        open
        onOpenChange={() => {}}
        removalCancelEnabled
      />,
    );

    fireEvent.click(screen.getByText("Cancelar remoção"));

    expect(cancelRemovalAction).not.toHaveBeenCalled();
    expect(
      screen.getByText(/confirma o cancelamento/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirmar cancelamento"));

    expect(cancelRemovalAction).toHaveBeenCalledWith("r1");
  });

  it("shows a Cancelada marker and no control for an already-cancelled removal", () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });

    render(
      <RemovalDetailModal
        removal={{ ...REMOVAL, cancelled: true }}
        open
        onOpenChange={() => {}}
        removalCancelEnabled
      />,
    );

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryByText("Cancelar remoção")).not.toBeInTheDocument();
  });

  it("refreshes after a successful cancellation and shows the Cancelada marker", async () => {
    fetchRemovalItems.mockResolvedValue({ success: true, items: [] });
    cancelRemovalAction.mockResolvedValue({ success: true, removal: {} });

    render(
      <RemovalDetailModal
        removal={REMOVAL}
        open
        onOpenChange={() => {}}
        removalCancelEnabled
      />,
    );

    fireEvent.click(screen.getByText("Cancelar remoção"));
    fireEvent.click(screen.getByText("Confirmar cancelamento"));

    await waitFor(() => {
      expect(screen.getByText("Cancelada")).toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalled();
  });
});
