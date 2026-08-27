import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopLoader } from "@/components/ui/top-loader";
import { encodeItemQrPayload } from "@/lib/qrcode/payload";
import { checkItemStatus } from "@/lib/actions/item-status";
import { uploadPedidoImage } from "@/lib/actions/pedido-image";
import { removeItems } from "@/lib/actions/removals";
import NewRemovalPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let scanCallback: ((result: { getText(): string } | null) => void) | undefined;

vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    decodeFromVideoDevice(
      _deviceId: unknown,
      _video: unknown,
      callback: (result: { getText(): string } | null) => void,
    ) {
      scanCallback = callback;
      return Promise.resolve({ stop: vi.fn() });
    }
  },
}));

vi.mock("@/lib/actions/item-status", () => ({
  checkItemStatus: vi.fn(),
}));

/**
 * An item as the database holds it. The QR code carries only `qrToken`, so
 * tests register the item here and the mocked `checkItemStatus` resolves it —
 * exactly how the real flow reads an item's current data at scan time.
 */
type StockedItem = {
  qrToken: string;
  number: number;
  notaFiscal: string;
  material: string;
  weight: string;
  corrida?: string | null;
  status?: "in_stock" | "removed";
};

const stockedItems = new Map<string, StockedItem>();

function stockItem(item: StockedItem): StockedItem {
  stockedItems.set(item.qrToken, item);
  return item;
}

/** What the scanner reads off this item's printed label. */
function scanTextFor(item: StockedItem): string {
  return encodeItemQrPayload({ qrToken: item.qrToken });
}

vi.mock("@/lib/actions/removals", () => ({
  removeItems: vi.fn(),
}));

vi.mock("@/lib/actions/pedido-image", () => ({
  uploadPedidoImage: vi.fn(),
}));

beforeEach(() => {
  stockedItems.clear();
  vi.mocked(checkItemStatus).mockImplementation(async (qrToken: string) => {
    const stocked = stockedItems.get(qrToken);
    if (!stocked) {
      return { success: true as const, status: "not_found" as const };
    }
    const { status = "in_stock", corrida = null, ...item } = stocked;
    return { success: true as const, status, item: { ...item, corrida } };
  });
  // jsdom has no real object URL implementation, used by the pedido image
  // preview (components/removals/pedido-image-attach.tsx).
  URL.createObjectURL = vi.fn(() => "blob:mock-pedido-image");
  URL.revokeObjectURL = vi.fn();
  vi.mocked(uploadPedidoImage).mockResolvedValue({
    success: true,
    path: "removal-pedidos/mock-pedido.jpg",
  });
});

async function scanItem(item: StockedItem) {
  stockItem(item);
  fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
  await waitFor(() => expect(scanCallback).toBeDefined());
  scanCallback!({ getText: () => scanTextFor(item) });
}

function attachPedidoImage() {
  const input = screen.getByTestId("pedido-image-input");
  const file = new File([new Uint8Array([1, 2, 3])], "pedido.png", {
    type: "image/png",
  });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("NewRemovalPage scan feedback", () => {
  it("shows a confirmation message after a successful scan", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Item adicionado: Aço — 10 Ton");
    expect(toast).toHaveClass("bg-emerald-600");
  });

  it("shows a red error toast when the scanned item is not found", async () => {
    render(<NewRemovalPage />);

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        encodeItemQrPayload({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
        }),
    });

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Item não encontrado.");
    expect(toast).toHaveClass("bg-destructive");
  });

  it("shows a red error toast when the scanned item was already removed", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
      status: "removed",
    });

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Este item já foi removido anteriormente.");
    expect(toast).toHaveClass("bg-destructive");
  });

  it("shows the camera only while actively scanning", async () => {
    render(<NewRemovalPage />);

    const video = document.querySelector("video")!;
    expect(video.parentElement).toHaveClass("h-0");

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());

    expect(video.parentElement).toHaveClass("opacity-100");
  });
});

describe("NewRemovalPage scanned items list", () => {
  it("shows the item's Nota Fiscal as a distinct labeled chip, separate from the identifier", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    expect(await screen.findByText("NF-100")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Aço")).toBeInTheDocument();
    expect(screen.getAllByText("10 Ton").length).toBeGreaterThan(0);
  });

  it("shows each scanned item's own number, in scan order, not its position in the list", async () => {
    render(<NewRemovalPage />);

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());

    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
          number: 4,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });
    await screen.findByText("Item 4");

    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "6b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8b",
          number: 2,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });
    await screen.findByText("Item 2");

    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "7b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8c",
          number: 5,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });
    await screen.findByText("Item 5");

    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 3")).not.toBeInTheDocument();
  });

  it("shows the item's current weight, not the weight printed on its label", async () => {
    render(<NewRemovalPage />);

    // The label was printed at 10 Ton; the item weighs 12 Ton now.
    const item = stockItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "12",
    });

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        JSON.stringify({
          qrToken: item.qrToken,
          identifier: "Item 1 - NF-100",
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        }),
    });

    expect((await screen.findAllByText("12 Ton")).length).toBeGreaterThan(0);
    expect(screen.queryByText("10 Ton")).not.toBeInTheDocument();
    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Item adicionado: Aço — 12 Ton");
  });

  it("scans a label printed in the legacy format, resolving its data from the database", async () => {
    render(<NewRemovalPage />);

    const item = stockItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 3,
      notaFiscal: "NF-200",
      material: "Cobre",
      weight: "5",
    });

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        JSON.stringify({
          qrToken: item.qrToken,
          identifier: "Item 3 - NF-200",
          material: "Cobre",
          weight: "5",
        }),
    });

    expect(await screen.findByText("NF-200")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("removes a scanned item when its remove button is clicked", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    expect(await screen.findByText("NF-100")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Remover Item 1 - NF-100/ }),
    );

    await waitFor(() =>
      expect(screen.queryByText("NF-100")).not.toBeInTheDocument(),
    );
  });
});

describe("NewRemovalPage sticky total bar", () => {
  it("disables the Concluir Remoção CTA while no items are scanned", () => {
    render(<NewRemovalPage />);

    const ctas = screen.getAllByRole("button", {
      name: /Concluir Remoção \(0 itens\)/,
    });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) expect(cta).toBeDisabled();
  });

  it("shows the live total weight and enables the CTA once an item is scanned", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });
    attachPedidoImage();

    await waitFor(() => {
      const ctas = screen.getAllByRole("button", {
        name: /Concluir Remoção \(1 item\)/,
      });
      expect(ctas.length).toBeGreaterThan(0);
      for (const cta of ctas) expect(cta).not.toBeDisabled();
    });
    expect(screen.getAllByText("10 Ton").length).toBeGreaterThan(0);
  });

  it("keeps the Concluir Remoção CTA disabled while items are scanned but no Pedido image is attached", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    const ctas = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(1 item\)/,
    });
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) expect(cta).toBeDisabled();
  });

  it("opens the review dialog when the CTA is clicked", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });
    attachPedidoImage();

    const [cta] = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(1 item\)/,
    });
    fireEvent.click(cta);

    expect(await screen.findByText("Revisar Remoção")).toBeInTheDocument();
  });
});

describe("NewRemovalPage Pedido image upload failure", () => {
  it("shows the upload error and keeps the scanned items and form input intact", async () => {
    vi.mocked(uploadPedidoImage).mockResolvedValue({
      success: false,
      error: "Falha ao enviar a imagem do Pedido. Tente novamente.",
    });

    render(<NewRemovalPage />);

    fireEvent.change(screen.getByLabelText("Motorista"), {
      target: { value: "João Silva" },
    });

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });
    attachPedidoImage();

    const [cta] = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(1 item\)/,
    });
    fireEvent.click(cta);

    const dialog = await screen.findByRole("dialog", {
      name: "Revisar Remoção",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );

    expect(
      await screen.findByText(
        "Falha ao enviar a imagem do Pedido. Tente novamente.",
      ),
    ).toBeInTheDocument();
    expect(removeItems).not.toHaveBeenCalled();

    // The rest of the removal input survives the failed upload.
    expect(screen.getByLabelText("Motorista")).toHaveValue("João Silva");
    expect(screen.getByText("NF-100")).toBeInTheDocument();
  });
});

describe("NewRemovalPage review dialog", () => {
  async function openReviewDialogWithTwoNotasFiscais() {
    render(<NewRemovalPage />);

    fireEvent.change(screen.getByLabelText("Data e hora de saída"), {
      target: { value: "2026-07-18T14:35" },
    });
    fireEvent.change(screen.getByLabelText("Motorista"), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByLabelText("Placa do veículo"), {
      target: { value: "ABC1234" },
    });

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
          number: 1,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });
    await screen.findByText("NF-100");

    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "6c2f7f3e-7c1b-5c9b-ac1b-3f3f7c1b5c9b",
          number: 1,
          notaFiscal: "NF-200",
          material: "Cobre",
          weight: "5",
        })),
    });
    await screen.findByText("NF-200");
    attachPedidoImage();

    const [cta] = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(2 itens\)/,
    });
    fireEvent.click(cta);

    return screen.findByRole("dialog", { name: "Revisar Remoção" });
  }

  it("shows the exit date, driver, and items grouped by Nota Fiscal with a highlighted total", async () => {
    const dialog = await openReviewDialogWithTwoNotasFiscais();

    expect(
      within(dialog).getByText("18/07/2026 · 14:35"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("João Silva")).toBeInTheDocument();
    expect(within(dialog).getByText("ABC1234")).toBeInTheDocument();

    const nf100Group = within(dialog)
      .getByText("NF-100 · Aço")
      .closest("div")!;
    expect(within(nf100Group).getByText(/Item 1 - NF-100/)).toBeInTheDocument();

    const nf200Group = within(dialog)
      .getByText("NF-200 · Cobre")
      .closest("div")!;
    expect(within(nf200Group).getByText(/Item 1 - NF-200/)).toBeInTheDocument();

    expect(within(dialog).getByText("Peso Total Removido")).toBeInTheDocument();
    expect(within(dialog).getByText("15 Ton")).toBeInTheDocument();
  });

  it("closes the dialog without submitting when Cancelar is clicked", async () => {
    const dialog = await openReviewDialogWithTwoNotasFiscais();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(screen.queryByText("Revisar Remoção")).not.toBeInTheDocument(),
    );
    expect(removeItems).not.toHaveBeenCalled();
  });

  it("submits removeItems and shows the receipt when Confirmar is clicked", async () => {
    vi.mocked(removeItems).mockResolvedValue({
      success: true,
      removal: { totalRemovedWeight: "15", vehiclePlate: "ABC1234" },
    } as never);

    const dialog = await openReviewDialogWithTwoNotasFiscais();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(removeItems).toHaveBeenCalledWith({
      exitDateTime: "2026-07-18T14:35",
      driver: "João Silva",
      vehiclePlate: "ABC1234",
      pedidoImagePath: "removal-pedidos/mock-pedido.jpg",
      qrTokens: [
        "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
        "6c2f7f3e-7c1b-5c9b-ac1b-3f3f7c1b5c9b",
      ],
    }));

    expect(
      await screen.findByText("Remoção Concluída"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Revisar Remoção")).not.toBeInTheDocument();
    expect(screen.getAllByText("ABC1234").length).toBeGreaterThan(0);
  });

  it("activates the TopLoader and swaps Confirmar to Removendo… while the remove-items transition is pending", async () => {
    let resolveRemoveItems: (value: unknown) => void = () => {};
    vi.mocked(removeItems).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRemoveItems = resolve;
        }) as never,
    );

    render(
      <>
        <TopLoader />
        <NewRemovalPage />
      </>,
    );

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
          number: 1,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });
    await screen.findByText("NF-100");
    attachPedidoImage();

    const [openReviewCta] = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(1 item\)/,
    });
    fireEvent.click(openReviewCta);

    const dialog = await screen.findByRole("dialog", {
      name: "Revisar Remoção",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );

    // The dialog makes the rest of the tree inert (aria-hidden) while open,
    // so query with `hidden: true` to still find the backgrounded TopLoader.
    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", {
          name: "Carregando",
          hidden: true,
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Removendo…", hidden: true }),
    ).toBeDisabled();

    resolveRemoveItems({
      success: true,
      removal: { totalRemovedWeight: "10", vehiclePlate: "ABC1234" },
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("progressbar", {
          name: "Carregando",
          hidden: true,
        }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("NewRemovalPage exit date/time defaults", () => {
  it("defaults Data e hora de saída to now on mount", () => {
    const now = new Date(2026, 6, 17, 14, 5);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(<NewRemovalPage />);

    expect(screen.getByLabelText("Data e hora de saída")).toHaveValue(
      "2026-07-17T14:05",
    );

    vi.useRealTimers();
  });
});

describe("NewRemovalPage form placeholders", () => {
  it("shows a Portuguese placeholder on the Motorista field", () => {
    render(<NewRemovalPage />);

    expect(screen.getByLabelText("Motorista")).toHaveAttribute(
      "placeholder",
      "Nome do motorista",
    );
  });
});

describe("NewRemovalPage vehicle plate field", () => {
  it("shows a required Placa do veículo field next to Motorista", () => {
    render(<NewRemovalPage />);

    expect(screen.getByLabelText("Placa do veículo")).toBeRequired();
  });

  it("shows the field error message when removeItems rejects the vehicle plate", async () => {
    vi.mocked(removeItems).mockResolvedValue({
      success: false,
      error: {
        fieldErrors: { vehiclePlate: ["required"] },
        formErrors: [],
      },
    } as never);

    render(<NewRemovalPage />);

    fireEvent.change(screen.getByLabelText("Motorista"), {
      target: { value: "João Silva" },
    });

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });
    attachPedidoImage();

    const [cta] = await screen.findAllByRole("button", {
      name: /Concluir Remoção \(1 item\)/,
    });
    fireEvent.click(cta);

    const dialog = await screen.findByRole("dialog", {
      name: "Revisar Remoção",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );

    expect(
      await screen.findByText("Informe a placa do veículo."),
    ).toBeInTheDocument();
  });
});

describe("NewRemovalPage scanned items header", () => {
  it("shows the scanned item count and distinct Nota Fiscal count", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    expect(await screen.findByText("ITENS LIDOS (1)")).toBeInTheDocument();
    expect(screen.getByText("1 nota fiscal")).toBeInTheDocument();
  });
});

describe("NewRemovalPage clear list", () => {
  it("clears all scanned items when Limpar lista is clicked", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    expect(await screen.findByText("NF-100")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar lista" }));

    await waitFor(() =>
      expect(screen.queryByText("NF-100")).not.toBeInTheDocument(),
    );
    for (const cta of screen.getAllByRole("button", {
      name: /Concluir Remoção \(0 itens\)/,
    })) {
      expect(cta).toBeDisabled();
    }
  });
});

describe("NewRemovalPage scan cooldown", () => {
  it("ignores an immediate re-read of the same code right after a successful scan, instead of flashing 'already scanned'", async () => {
    render(<NewRemovalPage />);

    const item = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      number: 1,
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    };

    await scanItem(item);
    expect(await screen.findByText("ITENS LIDOS (1)")).toBeInTheDocument();

    // The continuous decoder re-reads the same code on the very next frame.
    scanCallback!({ getText: () => scanTextFor(item) });

    expect(screen.getByText("ITENS LIDOS (1)")).toBeInTheDocument();
    expect(
      screen.queryByText("Este item já foi escaneado nesta remoção."),
    ).not.toBeInTheDocument();
  });

  it("does not arm the cooldown on an invalid scan, so a valid scan right after is still accepted", async () => {
    render(<NewRemovalPage />);

    fireEvent.click(screen.getAllByText("Iniciar Escaneamento")[0]);
    await waitFor(() => expect(scanCallback).toBeDefined());

    scanCallback!({ getText: () => "not a valid qr payload" });
    expect(
      (await screen.findAllByText("Código QR inválido.")).length,
    ).toBeGreaterThan(0);

    scanCallback!({
      getText: () =>
        scanTextFor(stockItem({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
          number: 1,
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        })),
    });

    expect(await screen.findByText("ITENS LIDOS (1)")).toBeInTheDocument();
  });
});
