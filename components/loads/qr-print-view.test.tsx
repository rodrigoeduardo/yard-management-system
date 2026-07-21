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
  it("shows the success banner hidden in print (mobile)", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const banner = screen.getByText("Carga registrada no estoque");
    expect(banner.closest("div")?.parentElement?.className).toMatch(
      /\bprint:hidden\b/,
    );
  });

  it("shows the inline success chip hidden in print (desktop)", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(screen.getByText("Carga registrada")).toBeInTheDocument();
  });

  it("shows the desktop title", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(
      screen.getByRole("heading", { name: "QR Codes da Carga" }),
    ).toBeInTheDocument();
  });

  it("shows the NF/material context on the mobile chip and the desktop context line", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(screen.getAllByText("NF-123456").length).toBe(2);
    expect(screen.getAllByText("Aço").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the item count on the mobile chip", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(screen.getByText("2 etiquetas")).toBeInTheDocument();
  });

  it("shows the entry date and item count in the desktop context line", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    expect(
      screen.getByText("Entrada 01/01/2026 · 09:30 · 2 etiquetas"),
    ).toBeInTheDocument();
  });

  it("renders the print buttons with label-roll wording (no 'em 1 folha')", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const buttons = screen.getAllByRole("button", {
      name: "Imprimir 2 etiquetas",
    });
    expect(buttons.length).toBe(2);
  });

  it("renders a 'Voltar ao estoque' link in both the mobile stack and the desktop header row", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const links = screen.getAllByRole("link", { name: "Voltar ao estoque" });
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/inventory");
    }
  });

  it("renders one card per QR code with the real image, identifier, material and weight", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const img1 = screen.getByAltText("Item 1 - NF-123456");
    expect(img1).toHaveAttribute("src", "data:image/png;base64,item1");
    expect(screen.getByText("Item 1 - NF-123456")).toBeInTheDocument();
    expect(screen.getByText("10.5 t")).toBeInTheDocument();

    const img2 = screen.getByAltText("Item 2 - NF-123456");
    expect(img2).toHaveAttribute("src", "data:image/png;base64,item2");
    expect(screen.getByText("12 t")).toBeInTheDocument();
  });

  it("lays the grid mobile-first (2 cols) with md: 4 cols and stacks one label per page in print", () => {
    const { container } = render(
      <QrPrintView summary={summary} qrCodes={qrCodes} />,
    );

    const grid = container.querySelector('[data-testid="qr-grid"]');
    expect(grid?.className).toMatch(/\bgrid-cols-2\b/);
    expect(grid?.className).toMatch(/\bmd:grid-cols-4\b/);
    expect(grid?.className).toMatch(/\bprint:flex\b/);
    expect(grid?.className).toMatch(/\bprint:flex-col\b/);
  });

  it("forces a page break after every tag so each prints on its own label", () => {
    const { container } = render(
      <QrPrintView summary={summary} qrCodes={qrCodes} />,
    );

    const cards = container.querySelectorAll('[data-testid="qr-grid"] > *');
    expect(cards.length).toBe(2);
    for (const card of cards) {
      expect(card.className).toMatch(/\bprint:break-after-page\b/);
    }
  });

  it("sizes each tag to the 100x50mm label with a scannable QR in print", () => {
    const { container } = render(
      <QrPrintView summary={summary} qrCodes={qrCodes} />,
    );

    const cards = container.querySelectorAll('[data-testid="qr-grid"] > *');
    for (const card of cards) {
      expect(card.className).toMatch(/print:w-\[100mm\]/);
      expect(card.className).toMatch(/print:h-\[50mm\]/);
      expect(card.className).toMatch(/print:flex-row/);
    }

    const img1 = screen.getByAltText("Item 1 - NF-123456");
    expect(img1.className).toMatch(/print:w-\[40mm\]|print:w-\[4[0-9]mm\]/);
  });
});
