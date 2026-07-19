/**
 * Shared rasterizer for the Pátio brand mark (components/nav/brand-logo.tsx:
 * a rounded-square `bg-primary` tile with a rotated `bg-primary-foreground`
 * square inside), used by both scripts/generate-pwa-icons.ts and
 * scripts/generate-favicon.ts so the two icon sets never drift apart.
 *
 * Uses pngjs (already a devDependency for QR code test decoding) instead of
 * a canvas/image library, since a flat-color rounded square plus a rotated
 * square (i.e. a diamond, exactly the set of points where
 * |dx| + |dy| <= r) is simple enough to rasterize by hand.
 */
import { PNG } from "pngjs";
import { PWA_THEME_COLOR } from "../../lib/pwa/colors";

export const PRIMARY = hexToRgb(PWA_THEME_COLOR);
export const PRIMARY_FOREGROUND = { r: 0xfa, g: 0xfa, b: 0xfa }; // --primary-foreground: oklch(0.985 0 0)

export type BrandIconSpec = {
  size: number;
  /** Corner radius as a ratio of size, or null for a full-bleed square (OS applies its own mask: iOS/maskable). */
  cornerRadiusRatio: number | null;
  /** Diamond half-diagonal (center to tip) as a ratio of size. */
  diamondHalfRatio: number;
};

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function insideRoundedRect(x: number, y: number, size: number, radius: number): boolean {
  const half = size / 2;
  const dx = Math.max(Math.abs(x - half) - (half - radius), 0);
  const dy = Math.max(Math.abs(y - half) - (half - radius), 0);
  return dx * dx + dy * dy <= radius * radius;
}

export function drawBrandIconPng(spec: BrandIconSpec): Buffer {
  const { size, cornerRadiusRatio, diamondHalfRatio } = spec;
  const png = new PNG({ width: size, height: size });
  const half = size / 2;
  const diamondHalf = size * diamondHalfRatio;
  const radius = cornerRadiusRatio !== null ? size * cornerRadiusRatio : 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const inBackground =
        cornerRadiusRatio === null || insideRoundedRect(x + 0.5, y + 0.5, size, radius);

      if (!inBackground) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      const dx = Math.abs(x + 0.5 - half);
      const dy = Math.abs(y + 0.5 - half);
      const inDiamond = dx + dy <= diamondHalf;
      const color = inDiamond ? PRIMARY_FOREGROUND : PRIMARY;

      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}
