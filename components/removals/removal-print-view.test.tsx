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
    expect(image.className).toMatch(/\bobject-contain\b/);
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

  it("wraps the Pedido block in the same bordered container as the items table", () => {
    render(
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl="https://example.com/pedido.png"
        items={items}
      />,
    );

    const pedidoLabel = screen.getByText("Pedido");
    expect(pedidoLabel.className).toMatch(/\btext-xs\b/);
    expect(pedidoLabel.className).toMatch(/\btext-muted-foreground\b/);
    expect(pedidoLabel.className).not.toMatch(/text-\[13px\]/);
    expect(pedidoLabel.className).not.toMatch(/font-semibold/);

    const header = pedidoLabel.closest("div");
    expect(header?.className).toMatch(/\bbg-muted\b/);
    expect(header?.className).toMatch(/\bborder-b\b/);
    expect(header?.className).toMatch(/\bborder-border\b/);

    const panel = header?.parentElement;
    expect(panel?.className).toMatch(/\brounded-\[14px\]/);
    expect(panel?.className).toMatch(/\bborder-border\b/);
    expect(panel?.className).toMatch(/\boverflow-hidden\b/);

    expect(panel?.className).not.toMatch(/\bp-4\b/);
  });

  it("renders the empty-state Pedido message inside the same bordered container with the header strip", () => {
    render(
      <RemovalPrintView summary={summary} pedidoImageUrl={null} items={items} />,
    );

    const pedidoLabel = screen.getByText("Pedido");
    const header = pedidoLabel.closest("div");
    expect(header?.className).toMatch(/\bbg-muted\b/);

    const panel = header?.parentElement;
    expect(panel?.className).toMatch(/\brounded-\[14px\]/);
    expect(panel?.className).toMatch(/\bborder-border\b/);

    const fallback = screen.getByText(/imagem do pedido indispon/i);
    expect(panel?.contains(fallback)).toBe(true);
  });

  it("repeats the table header on every printed page and never splits a row across a page break (issue #286)", () => {
    const { container } = render(
      <RemovalPrintView
        summary={summary}
        pedidoImageUrl="https://example.com/pedido.png"
        items={items}
      />,
    );

    const thead = container.querySelector("thead");
    expect(thead?.className).toMatch(/\bprint:table-header-group\b/);

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(items.length);
    for (const row of rows) {
      expect(row.className).toMatch(/\bprint:break-inside-avoid\b/);
    }
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
