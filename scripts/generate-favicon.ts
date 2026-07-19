/**
 * One-off generator for app/favicon.ico (issue #167), replacing the
 * Next.js/framework default favicon with the Pátio brand mark. Reuses the
 * same rasterizer as scripts/generate-pwa-icons.ts.
 *
 * Every modern browser (Chrome, Safari, Firefox, Edge) accepts PNG-compressed
 * images inside an .ico container, so this wraps the 16x16 and 32x32 PNGs in
 * a minimal ICO directory rather than hand-rolling legacy BMP encoding.
 *
 * Not part of the build — run manually and commit the result whenever the
 * brand mark or its colors change:
 *
 *   npx tsx scripts/generate-favicon.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { drawBrandIconPng } from "./lib/brand-icon";

const SIZES = [16, 32];
const ICO_HEADER_SIZE = 6;
const ICO_ENTRY_SIZE = 16;

function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(ICO_HEADER_SIZE);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = ICO_HEADER_SIZE + ICO_ENTRY_SIZE * images.length;
  const entries: Buffer[] = [];
  for (const image of images) {
    const entry = Buffer.alloc(ICO_ENTRY_SIZE);
    const dimension = image.size >= 256 ? 0 : image.size; // 0 means 256px
    entry.writeUInt8(dimension, 0); // width
    entry.writeUInt8(dimension, 1); // height
    entry.writeUInt8(0, 2); // color count (0: not palette-indexed)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.data.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    offset += image.data.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

const images = SIZES.map((size) => ({
  size,
  data: drawBrandIconPng({ size, cornerRadiusRatio: 0.2, diamondHalfRatio: 0.16 }),
}));

writeFileSync(path.join(__dirname, "..", "app", "favicon.ico"), buildIco(images));
console.log("wrote app/favicon.ico");
