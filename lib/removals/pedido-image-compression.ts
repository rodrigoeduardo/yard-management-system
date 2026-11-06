/** Longest side, in pixels, of an uploaded Pedido image (#362). */
const MAX_SIDE_PX = 1600;

const JPEG_QUALITY = 0.8;

/**
 * Scales `width`×`height` so the longest side fits within `maxSide`,
 * keeping the aspect ratio. Never upscales.
 */
export function fitWithinMaxSide(
  width: number,
  height: number,
  maxSide = MAX_SIDE_PX,
): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Downscales and re-encodes the Pedido image as JPEG in the browser before
 * upload, so a 3–5 MB phone photo lands in Storage at a few hundred KB —
 * enough to stay legible on screen and in the printed receipt (#362).
 *
 * Best effort: when the browser cannot decode the image (e.g. HEIC on
 * Chrome) or re-encoding would not shrink it, the original file is returned
 * unchanged, so compression never blocks a removal nor grows the upload.
 */
export async function compressPedidoImage(file: File): Promise<File> {
  try {
    // "from-image" applies the EXIF orientation, so a portrait phone photo
    // decodes upright and is not uploaded rotated.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    let blob: Blob | null;
    try {
      const { width, height } = fitWithinMaxSide(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        return file;
      }
      context.drawImage(bitmap, 0, 0, width, height);
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
      );
    } finally {
      bitmap.close();
    }

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], toJpegName(file.name), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function toJpegName(name: string): string {
  const baseName = name.replace(/\.[^./]*$/, "");
  return `${baseName || "pedido"}.jpg`;
}
