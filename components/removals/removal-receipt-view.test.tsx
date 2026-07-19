import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalReceiptView } from "./removal-receipt-view";
import type { RemovalReceipt } from "@/lib/removals/receipt";

const receipt: RemovalReceipt = {
  itemCount: 2,
  byNotaFiscal: [
    {
      notaFiscal: "NF-100",
      items: [
        {
          qrToken: "token-1",
          identifier: "Item 1 - NF-100",
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        },
      ],
    },
    {
      notaFiscal: "NF-200",
      items: [
        {
          qrToken: "token-2",
          identifier: "Item 1 - NF-200",
          notaFiscal: "NF-200",
          material: "Cobre",
          weight: "5",
        },
      ],
    },
  ],
  totalRemovedWeight: "15",
};

describe("RemovalReceiptView", () => {
  it("shows the completed-removal heading", () => {
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={vi.fn()}
        onViewInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("Remoção Concluída")).toBeInTheDocument();
  });

  it("shows the total item count", () => {
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={vi.fn()}
        onViewInventory={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/2 itens/).length).toBeGreaterThan(0);
  });

  it("groups items per Nota Fiscal, each with its identifier, material and weight in kg", () => {
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={vi.fn()}
        onViewInventory={vi.fn()}
      />,
    );

    expect(screen.getByText("NF-100")).toBeInTheDocument();
    expect(screen.getByText(/Item 1 - NF-100/)).toBeInTheDocument();
    expect(screen.getAllByText("Aço").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10 kg").length).toBeGreaterThan(0);

    expect(screen.getByText("NF-200")).toBeInTheDocument();
    expect(screen.getByText(/Item 1 - NF-200/)).toBeInTheDocument();
    expect(screen.getAllByText("Cobre").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5 kg").length).toBeGreaterThan(0);
  });

  it("shows the total removed weight in kg prominently", () => {
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={vi.fn()}
        onViewInventory={vi.fn()}
      />,
    );

    expect(screen.getAllByText("15 kg").length).toBeGreaterThan(0);
  });

  it("calls onNewRemoval when 'Nova Remoção' is clicked", () => {
    const onNewRemoval = vi.fn();
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={onNewRemoval}
        onViewInventory={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole("button", {
      name: "Nova Remoção",
    })) {
      fireEvent.click(button);
    }

    expect(onNewRemoval).toHaveBeenCalled();
  });

  it("calls onViewInventory when 'Ver Estoque' is clicked", () => {
    const onViewInventory = vi.fn();
    render(
      <RemovalReceiptView
        receipt={receipt}
        onNewRemoval={vi.fn()}
        onViewInventory={onViewInventory}
      />,
    );

    for (const button of screen.getAllByRole("button", {
      name: "Ver Estoque",
    })) {
      fireEvent.click(button);
    }

    expect(onViewInventory).toHaveBeenCalled();
  });
});
