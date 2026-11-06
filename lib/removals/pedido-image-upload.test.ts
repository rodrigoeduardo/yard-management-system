import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPedidoImageUploadTarget } from "@/lib/actions/pedido-image";
import { uploadPedidoImage } from "./pedido-image-upload";

const uploadToSignedUrl = vi.fn();
const from = vi.fn(() => ({ uploadToSignedUrl }));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({ storage: { from } }),
}));

vi.mock("@/lib/actions/pedido-image", () => ({
  createPedidoImageUploadTarget: vi.fn(),
}));

const UPLOAD_FAILED = "Falha ao enviar a imagem do Pedido. Tente novamente.";

function jpegFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], "pedido.jpg", {
    type: "image/jpeg",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createPedidoImageUploadTarget).mockResolvedValue({
    success: true,
    path: "3f1c.jpg",
    token: "signed-token",
  });
  uploadToSignedUrl.mockResolvedValue({ data: { path: "3f1c.jpg" }, error: null });
});

describe("uploadPedidoImage", () => {
  it("sends only the file's metadata to the server, never its bytes", async () => {
    const file = jpegFile();

    await uploadPedidoImage(file);

    expect(createPedidoImageUploadTarget).toHaveBeenCalledWith({
      type: "image/jpeg",
      size: file.size,
    });
  });

  it("uploads the file straight to the signed Storage URL and returns its path", async () => {
    const file = jpegFile();

    const result = await uploadPedidoImage(file);

    expect(from).toHaveBeenCalledWith("removal-pedidos");
    expect(uploadToSignedUrl).toHaveBeenCalledWith(
      "3f1c.jpg",
      "signed-token",
      file,
      { contentType: "image/jpeg" },
    );
    expect(result).toEqual({ success: true, path: "3f1c.jpg" });
  });

  it("returns the server's validation error without uploading", async () => {
    vi.mocked(createPedidoImageUploadTarget).mockResolvedValue({
      success: false,
      error: "Imagem muito grande. O limite é 20MB.",
    });

    const result = await uploadPedidoImage(jpegFile());

    expect(uploadToSignedUrl).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: "Imagem muito grande. O limite é 20MB.",
    });
  });

  it("maps a Storage upload error to the retry message", async () => {
    uploadToSignedUrl.mockResolvedValue({
      data: null,
      error: new Error("Payload too large"),
    });

    const result = await uploadPedidoImage(jpegFile());

    expect(result).toEqual({ success: false, error: UPLOAD_FAILED });
  });

  it("maps a thrown network error to the retry message", async () => {
    uploadToSignedUrl.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await uploadPedidoImage(jpegFile());

    expect(result).toEqual({ success: false, error: UPLOAD_FAILED });
  });

  it("maps a failed upload-target request to the retry message", async () => {
    vi.mocked(createPedidoImageUploadTarget).mockRejectedValue(
      new Error("Server action failed"),
    );

    const result = await uploadPedidoImage(jpegFile());

    expect(uploadToSignedUrl).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: UPLOAD_FAILED });
  });
});
