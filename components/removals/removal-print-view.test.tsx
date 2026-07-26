import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RemovalPrintView } from "./removal-print-view";
import type { RemovalReceiptItemDetail } from "@/lib/db/removal-items";
import type { RemovalReceiptSummary } from "@/lib/removals/print";

const summary: RemovalReceiptSummary = {
  exitDate: "05/03/2026 · 09:00",
  driver: "John Doe",
  vehiclePlate: "ABC1234",
  totalRemovedWeight: "15.5 t",
};

const items: RemovalReceiptItemDetail[] = [
  {
    id: "item-1",
    identifier: "Item 1 - NF-100",
    weight: "10",
    notaFiscal: "NF-100",
    material: "Aço",
  },
  {
    id: "item-2",
    identifier: "Item 1 - NF-200",
    weight: "5.5",
    notaFiscal: "NF-200",
    material: "Cobre",
  },
];

describe("RemovalPrintView", () => {
  it("shows the removal header fields: exit date/time, driver, vehicle plate, total weight", () => {
    render(
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl="https://example.com/pedido.png"
        items={items}
      />,
    );

    expect(screen.getByText("05/03/2026 · 09:00")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ABC1234")).toBeInTheDocument();
    expect(screen.getByText("15.5 t")).toBeInTheDocument();
  });

  it("renders the attached Pedido image", () => {
    render(
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl="https://example.com/pedido.png"
        items={items}
      />,
    );

    const image = screen.getByAltText(/pedido/i);
    expect(image).toHaveAttribute("src", "https://example.com/pedido.png");
  });

  it("shows a fallback message when the Pedido image URL is unavailable", () => {
    render(
      <RemovalPrintView summary={summary} pedidoImageUrl={null} items={items} />,
    );

    expect(screen.queryByAltText(/pedido/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/imagem do pedido indispon/i),
    ).toBeInTheDocument();
  });

  it("lists each removed item with its item number, NF, material and weight", () => {
    render(
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl="https://example.com/pedido.png"
        items={items}
      />,
    );

    expect(screen.getByText("Item 1 - NF-100")).toBeInTheDocument();
    expect(screen.getByText("NF-100")).toBeInTheDocument();
    expect(screen.getByText("Aço")).toBeInTheDocument();
    expect(screen.getByText("10 t")).toBeInTheDocument();

    expect(screen.getByText("Item 1 - NF-200")).toBeInTheDocument();
    expect(screen.getByText("NF-200")).toBeInTheDocument();
    expect(screen.getByText("Cobre")).toBeInTheDocument();
    expect(screen.getByText("5.5 t")).toBeInTheDocument();
  });
});
