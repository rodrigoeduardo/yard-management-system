/**
 * One-off generator for the PWA icon set (issue #143), redrawing the
 * BrandLogo diamond mark (components/nav/brand-logo.tsx) as raster PNGs at
 * the sizes app/manifest.ts and app/layout.tsx reference. Rasterization
 * lives in scripts/lib/brand-icon.ts, shared with scripts/generate-favicon.ts.
 *
 * Not part of the build — run manually and commit the resulting PNGs
 * whenever the brand mark or its colors change:
 *
 *   npx tsx scripts/generate-pwa-icons.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { drawBrandIconPng } from "./lib/brand-icon";

type IconSpec = {
  fileName: string;
  size: number;
  cornerRadiusRatio: number | null;
  diamondHalfRatio: number;
};

const ICONS: IconSpec[] = [
  { fileName: "icon-192.png", size: 192, cornerRadiusRatio: 0.2, diamondHalfRatio: 0.16 },
  { fileName: "icon-512.png", size: 512, cornerRadiusRatio: 0.2, diamondHalfRatio: 0.16 },
  // Maskable: full bleed, diamond kept well within the 80%-diameter safe zone.
  { fileName: "icon-maskable-512.png", size: 512, cornerRadiusRatio: null, diamondHalfRatio: 0.13 },
  // Apple touch icon: no transparency/rounding, iOS applies its own mask.
  { fileName: "apple-touch-icon.png", size: 180, cornerRadiusRatio: null, diamondHalfRatio: 0.16 },
];

const outDir = path.join(__dirname, "..", "public", "icons");
for (const spec of ICONS) {
  writeFileSync(path.join(outDir, spec.fileName), drawBrandIconPng(spec));
  console.log(`wrote public/icons/${spec.fileName}`);
}
