import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  compressPedidoImage,
  fitWithinMaxSide,
} from "./pedido-image-compression";

describe("fitWithinMaxSide", () => {
  it("scales a landscape image so its longest side is 1600 px", () => {
    expect(fitWithinMaxSide(4000, 3000)).toEqual({ width: 1600, height: 1200 });
  });

  it("scales a portrait image so its longest side is 1600 px", () => {
    expect(fitWithinMaxSide(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it("never upscales an image already within the limit", () => {
    expect(fitWithinMaxSide(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("keeps the aspect ratio, rounding to whole pixels", () => {
    expect(fitWithinMaxSide(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithinMaxSide(5000, 1)).toEqual({ width: 1600, height: 1 });
  });
});

// The unit project runs in Node, which has no image decoder or canvas, so
// the decode (createImageBitmap) and encode (canvas.toBlob) boundary is
// stubbed.
const createImageBitmap = vi.fn();
const close = vi.fn();
const drawImage = vi.fn();
const toBlob = vi.fn();
let encodedSize = 0;
let canvas: { width: number; height: number };

function photo(sizeBytes: number, type = "image/jpeg", name = "pedido.jpg") {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function decodesAs(width: number, height: number) {
  createImageBitmap.mockResolvedValue({ width, height, close });
}

beforeEach(() => {
  vi.clearAllMocks();
  encodedSize = 300 * 1024;
  canvas = { width: 0, height: 0 };
  toBlob.mockImplementation((callback: (blob: Blob | null) => void, type) =>
    callback(new Blob([new Uint8Array(encodedSize)], { type })),
  );
  vi.stubGlobal("createImageBitmap", createImageBitmap);
  vi.stubGlobal("document", {
    createElement: () =>
      Object.assign(canvas, { getContext: () => ({ drawImage }), toBlob }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compressPedidoImage", () => {
  it("downscales a 4000×3000 photo to a 1600×1200 JPEG smaller than the input", async () => {
    decodesAs(4000, 3000);
    const original = photo(4 * 1024 * 1024);

    const result = await compressPedidoImage(original);

    expect(canvas).toMatchObject({ width: 1600, height: 1200 });
    expect(drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ width: 4000, height: 3000 }),
      0,
      0,
      1600,
      1200,
    );
    expect(toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      0.8,
    );
    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("pedido.jpg");
    expect(result.size).toBe(300 * 1024);
    expect(result.size).toBeLessThan(original.size);
  });

  it("decodes respecting EXIF orientation, so a portrait photo stays portrait", async () => {
    // With imageOrientation: "from-image" the decoded bitmap already has
    // the EXIF rotation applied, so its dimensions are the upright ones.
    decodesAs(3000, 4000);
    const original = photo(4 * 1024 * 1024);

    await compressPedidoImage(original);

    expect(createImageBitmap).toHaveBeenCalledWith(original, {
      imageOrientation: "from-image",
    });
    expect(canvas).toMatchObject({ width: 1200, height: 1600 });
  });

  it("renames a re-encoded non-JPEG file to a .jpg extension", async () => {
    decodesAs(4000, 3000);

    const result = await compressPedidoImage(
      photo(4 * 1024 * 1024, "image/png", "pedido.png"),
    );

    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("pedido.jpg");
  });

  it("keeps the original file when re-encoding would not shrink it", async () => {
    decodesAs(800, 600);
    const original = photo(100 * 1024, "image/png", "screenshot.png");
    encodedSize = 150 * 1024;

    const result = await compressPedidoImage(original);

    expect(result).toBe(original);
  });

  it("keeps the original file when the browser cannot decode it", async () => {
    createImageBitmap.mockRejectedValue(
      new DOMException("The source image could not be decoded.", "InvalidStateError"),
    );
    const original = photo(3 * 1024 * 1024, "image/heic", "pedido.heic");

    const result = await compressPedidoImage(original);

    expect(result).toBe(original);
  });

  it("keeps the original file when the browser has no image decoder", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const original = photo(3 * 1024 * 1024);

    const result = await compressPedidoImage(original);

    expect(result).toBe(original);
  });

  it("keeps the original file when encoding fails", async () => {
    decodesAs(4000, 3000);
    toBlob.mockImplementation((callback: (blob: Blob | null) => void) =>
      callback(null),
    );
    const original = photo(4 * 1024 * 1024);

    const result = await compressPedidoImage(original);

    expect(result).toBe(original);
  });

  it("releases the decoded bitmap", async () => {
    decodesAs(4000, 3000);

    await compressPedidoImage(photo(4 * 1024 * 1024));

    expect(close).toHaveBeenCalled();
  });
});
