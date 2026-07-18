import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { encodeItemQrPayload } from "@/lib/qrcode/payload";
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
  checkItemStatus: vi
    .fn()
    .mockResolvedValue({ success: true, status: "in_stock" }),
}));

vi.mock("@/lib/actions/removals", () => ({
  removeItems: vi.fn(),
}));

async function scanItem(payload: {
  qrToken: string;
  identifier: string;
  notaFiscal?: string;
  material: string;
  weight: string;
}) {
  fireEvent.click(screen.getByText("Iniciar Escaneamento"));
  await waitFor(() => expect(scanCallback).toBeDefined());
  scanCallback!({ getText: () => encodeItemQrPayload(payload as never) });
}

describe("NewRemovalPage scanned items list", () => {
  it("shows the item's Nota Fiscal as a distinct labeled chip, separate from the identifier", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-100",
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    expect(await screen.findByText("NF-100")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Aço")).toBeInTheDocument();
    expect(screen.getAllByText("10 kg").length).toBeGreaterThan(0);
  });

  it("falls back to the identifier-embedded Nota Fiscal for legacy QR payloads without the distinct field", async () => {
    render(<NewRemovalPage />);

    const legacyPayload = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-200",
      material: "Aço",
      weight: "10",
    };

    fireEvent.click(screen.getByText("Iniciar Escaneamento"));
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({ getText: () => JSON.stringify(legacyPayload) });

    expect(await screen.findByText("NF-200")).toBeInTheDocument();
  });

  it("removes a scanned item when its remove button is clicked", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-100",
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

    const cta = screen.getByRole("button", {
      name: /Concluir Remoção \(0 itens\)/,
    });
    expect(cta).toBeDisabled();
  });

  it("shows the live total weight and enables the CTA once an item is scanned", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-100",
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Concluir Remoção \(1 item\)/ }),
      ).not.toBeDisabled(),
    );
    expect(screen.getAllByText("10 kg").length).toBeGreaterThan(0);
  });

  it("opens the review dialog when the CTA is clicked", async () => {
    render(<NewRemovalPage />);

    await scanItem({
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-100",
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    });

    fireEvent.click(
      await screen.findByRole("button", { name: /Concluir Remoção \(1 item\)/ }),
    );

    expect(await screen.findByText("Revisar Remoção")).toBeInTheDocument();
  });
});

describe("NewRemovalPage review dialog", () => {
  async function openReviewDialogWithTwoNotasFiscais() {
    render(<NewRemovalPage />);

    fireEvent.change(screen.getByLabelText("Data de Saída"), {
      target: { value: "2026-07-18" },
    });
    fireEvent.change(screen.getByLabelText("Motorista"), {
      target: { value: "João Silva" },
    });

    fireEvent.click(screen.getByText("Iniciar Escaneamento"));
    await waitFor(() => expect(scanCallback).toBeDefined());
    scanCallback!({
      getText: () =>
        encodeItemQrPayload({
          qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
          identifier: "Item 1 - NF-100",
          notaFiscal: "NF-100",
          material: "Aço",
          weight: "10",
        } as never),
    });
    await screen.findByText("NF-100");

    scanCallback!({
      getText: () =>
        encodeItemQrPayload({
          qrToken: "6c2f7f3e-7c1b-5c9b-ac1b-3f3f7c1b5c9b",
          identifier: "Item 1 - NF-200",
          notaFiscal: "NF-200",
          material: "Cobre",
          weight: "5",
        } as never),
    });
    await screen.findByText("NF-200");

    fireEvent.click(
      await screen.findByRole("button", {
        name: /Concluir Remoção \(2 itens\)/,
      }),
    );

    return screen.findByRole("dialog", { name: "Revisar Remoção" });
  }

  it("shows the exit date, driver, and items grouped by Nota Fiscal with a highlighted total", async () => {
    const dialog = await openReviewDialogWithTwoNotasFiscais();

    expect(within(dialog).getByText("2026-07-18")).toBeInTheDocument();
    expect(within(dialog).getByText("João Silva")).toBeInTheDocument();

    const nf100Group = within(dialog).getByText("NF-100").closest("div")!;
    expect(within(nf100Group).getByText(/Item 1 - NF-100/)).toBeInTheDocument();

    const nf200Group = within(dialog).getByText("NF-200").closest("div")!;
    expect(within(nf200Group).getByText(/Item 1 - NF-200/)).toBeInTheDocument();

    expect(within(dialog).getByText("Peso Total Removido")).toBeInTheDocument();
    expect(within(dialog).getByText("15 kg")).toBeInTheDocument();
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
      removal: { totalRemovedWeight: "15" },
    } as never);

    const dialog = await openReviewDialogWithTwoNotasFiscais();

    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(removeItems).toHaveBeenCalledWith({
      exitDate: "2026-07-18",
      driver: "João Silva",
      qrTokens: [
        "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
        "6c2f7f3e-7c1b-5c9b-ac1b-3f3f7c1b5c9b",
      ],
    }));

    expect(
      await screen.findByText("Remoção Concluída"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Revisar Remoção")).not.toBeInTheDocument();
  });
});
