import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { encodeItemQrPayload } from "@/lib/qrcode/payload";
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

describe("NewRemovalPage scanned items list", () => {
  it("shows the item's Nota Fiscal as a distinct labeled field, separate from the identifier", async () => {
    render(<NewRemovalPage />);

    fireEvent.click(screen.getByText("Iniciar Escaneamento"));
    await waitFor(() => expect(scanCallback).toBeDefined());

    const payload = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-100",
      notaFiscal: "NF-100",
      material: "Aço",
      weight: "10",
    };

    scanCallback!({ getText: () => encodeItemQrPayload(payload) });

    expect(await screen.findByText(/NF: NF-100/)).toBeInTheDocument();
    expect(screen.getByText(/Item 1 - NF-100/)).toBeInTheDocument();
  });

  it("falls back to the identifier-embedded Nota Fiscal for legacy QR payloads without the distinct field", async () => {
    render(<NewRemovalPage />);

    fireEvent.click(screen.getByText("Iniciar Escaneamento"));
    await waitFor(() => expect(scanCallback).toBeDefined());

    const legacyPayload = {
      qrToken: "5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a",
      identifier: "Item 1 - NF-200",
      material: "Aço",
      weight: "10",
    };

    scanCallback!({ getText: () => JSON.stringify(legacyPayload) });

    expect(await screen.findByText(/NF: NF-200/)).toBeInTheDocument();
  });
});
