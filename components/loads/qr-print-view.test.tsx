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
    expect(screen.getByText("10.5 Ton")).toBeInTheDocument();

    const img2 = screen.getByAltText("Item 2 - NF-123456");
    expect(img2).toHaveAttribute("src", "data:image/png;base64,item2");
    expect(screen.getByText("12 Ton")).toBeInTheDocument();
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

  it("enlarges the print-only font sizes of the identifier, material and weight lines without touching their screen sizes", () => {
    render(<QrPrintView summary={summary} qrCodes={qrCodes} />);

    const identifier = screen.getByText("Item 1 - NF-123456");
    expect(identifier.className).toMatch(/\btext-\[13px\]/);
    expect(identifier.className).toMatch(/\bmd:text-\[13\.5px\]/);
    expect(identifier.className).toMatch(/\bprint:text-\[5mm\]/);

    const material = screen.getAllByText("Aço").find((el) =>
      el.className.includes("text-[11.5px]"),
    );
    expect(material).toBeDefined();
    expect(material?.className).toMatch(/\bprint:text-\[4mm\]/);

    const weight = screen.getByText("10.5 Ton");
    expect(weight.className).toMatch(/\btext-xs\b/);
    expect(weight.className).toMatch(/\bmd:text-\[12\.5px\]/);
    expect(weight.className).toMatch(/\bprint:text-\[4\.5mm\]/);
  });

  it("keeps the worst-case identifier's text column within the 46mm print box", () => {
    const longIdentifier = "Item 128 - NF-123456789";
    const longQrCodes: LoadItemQrCode[] = [
      {
        itemId: "item-long",
        qrToken: "token-long",
        payload: {
          qrToken: "token-long",
          identifier: longIdentifier,
          notaFiscal: "NF-123456789",
          material: "Aço",
          weight: "10.5",
        },
        dataUrl: "data:image/png;base64,itemlong",
      },
    ];

    render(<QrPrintView summary={summary} qrCodes={longQrCodes} />);

    const identifier = screen.getByText(longIdentifier);
    expect(identifier.className).toMatch(/\bprint:text-\[5mm\]/);
    expect(identifier.className).toMatch(/\bprint:leading-\[5\.5mm\]/);

    const textColumn = identifier.parentElement;
    expect(textColumn?.className).toMatch(/\bprint:w-\[46mm\]/);

    const material = screen.getAllByText("Aço").find((el) =>
      el.className.includes("text-[11.5px]"),
    );
    expect(material).toBeDefined();
    expect(material?.className).toMatch(/\bprint:text-\[4mm\]/);
    expect(material?.className).toMatch(/\bprint:leading-\[4\.5mm\]/);
    expect(material?.parentElement).toBe(textColumn);

    const weight = screen.getByText("10.5 Ton");
    expect(weight.className).toMatch(/\bprint:text-\[4\.5mm\]/);
    expect(weight.className).toMatch(/\bprint:leading-\[5mm\]/);
    expect(weight.parentElement).toBe(textColumn);
  });

  it("keeps the label at 100x50mm and the weight line inside the 46mm text column with the widest realistic weight", () => {
    const wideWeightQrCodes: LoadItemQrCode[] = [
      {
        itemId: "item-wide",
        qrToken: "token-wide",
        payload: {
          qrToken: "token-wide",
          identifier: "Item 1 - NF-123456",
          notaFiscal: "NF-123456",
          material: "Aço",
          weight: "12345.67",
        },
        dataUrl: "data:image/png;base64,itemwide",
      },
    ];

    const { container } = render(
      <QrPrintView summary={summary} qrCodes={wideWeightQrCodes} />,
    );

    const cards = container.querySelectorAll('[data-testid="qr-grid"] > *');
    expect(cards.length).toBe(1);
    expect(cards[0].className).toMatch(/print:w-\[100mm\]/);
    expect(cards[0].className).toMatch(/print:h-\[50mm\]/);

    const weight = screen.getByText("12345.67 Ton");
    expect(weight.className).toMatch(/\bprint:text-\[4\.5mm\]/);

    const textColumn = weight.parentElement;
    expect(textColumn?.className).toMatch(/\bprint:w-\[46mm\]/);
  });

  it("keeps the print geometry classes unchanged on the card and QR image", () => {
    const { container } = render(
      <QrPrintView summary={summary} qrCodes={qrCodes} />,
    );

    const cards = container.querySelectorAll('[data-testid="qr-grid"] > *');
    for (const card of cards) {
      expect(card.className).toMatch(/print:p-\[4mm\]/);
      expect(card.className).toMatch(/print:gap-\[4mm\]/);
      expect(card.className).toMatch(/print:break-after-page/);
    }

    const img1 = screen.getByAltText("Item 1 - NF-123456");
    expect(img1.className).toMatch(/print:w-\[42mm\]/);
    expect(img1.className).toMatch(/print:max-w-none/);
    expect(img1.className).toMatch(/print:shrink-0/);
  });
});
