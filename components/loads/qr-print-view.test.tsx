import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QrPrintView } from "./qr-print-view";
import type { LoadItemQrCode } from "@/lib/qrcode/generate";
import type { LoadSummary } from "@/lib/loads/print";

const summary: LoadSummary = {
  notaFiscal: "NF-123456",
  material: "Aço",
  entryDate: "01/01/2026 · 09:30",
  itemCount: 2,
};

const qrCodes: LoadItemQrCode[] = [
  {
    itemId: "item-1",
    qrToken: "token-1",
    payload: {
      qrToken: "token-1",
      identifier: "Item 1 - NF-123456",
      notaFiscal: "NF-123456",
      material: "Aço",
      weight: "10.5",
    },
    dataUrl: "data:image/png;base64,item1",
  },
  {
    itemId: "item-2",
    qrToken: "token-2",
    payload: {
      qrToken: "token-2",
      identifier: "Item 2 - NF-123456",
      notaFiscal: "NF-123456",
      material: "Aço",
      weight: "12",
    },
    dataUrl: "data:image/png;base64,item2",
  },
];

describe("QrPrintView", () => {
  it("shows the success banner hidden in print", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const banner = screen.getByText("Carga registrada no estoque");
    expect(banner.closest("div")?.parentElement?.className).toMatch(
      /\bprint:hidden\b/,
    );
  });

  it("shows the NF/material context chip", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(screen.getByText("NF-123456")).toBeInTheDocument();
    expect(screen.getAllByText("Aço").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the entry date and time (dd/mm/aaaa · HH:mm) in the context chip", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(
      screen.getByText("Entrada 01/01/2026 · 09:30"),
    ).toBeInTheDocument();
  });

  it("renders the print button with the item count in the label", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(
      screen.getByRole("button", {
        name: "Imprimir 2 etiquetas em 1 folha",
      }),
    ).toBeInTheDocument();
  });

  it("renders styled secondary navigation actions", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(
      screen.getByRole("link", { name: "Voltar ao estoque" }),
    ).toHaveAttribute("href", "/inventory");
    expect(
      screen.getByRole("link", { name: "Adicionar outra carga" }),
    ).toHaveAttribute("href", "/loads/new");
  });

  it("renders one card per QR code with the real image, identifier, material and weight", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const img1 = screen.getByAltText("Item 1 - NF-123456");
    expect(img1).toHaveAttribute("src", "data:image/png;base64,item1");
    expect(screen.getByText("Item 1 - NF-123456")).toBeInTheDocument();
    expect(screen.getAllByText("Aço").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("10.5 kg")).toBeInTheDocument();

    const img2 = screen.getByAltText("Item 2 - NF-123456");
    expect(img2).toHaveAttribute("src", "data:image/png;base64,item2");
    expect(screen.getByText("12 kg")).toBeInTheDocument();
  });

  it("lays the grid mobile-first (2 cols) with md: 4 cols and print:grid-cols-3", () => {
    const { container } = render(
      <QrPrintView summary={summary} qrCodes={qrCodes} />,
    );

    const grid = container.querySelector('[data-testid="qr-grid"]');
    expect(grid?.className).toMatch(/\bgrid-cols-2\b/);
    expect(grid?.className).toMatch(/\bmd:grid-cols-4\b/);
    expect(grid?.className).toMatch(/\bprint:grid-cols-3\b/);
  });
});
