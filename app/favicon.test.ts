import { readFileSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";

/**
 * app/favicon.ico is a static asset (Next.js serves any app/favicon.ico
 * as-is), so it can't be exercised by calling a function — instead we parse
 * the ICO container ourselves and check the embedded images actually draw
 * the Pátio brand mark (see components/nav/brand-logo.tsx and
 * scripts/generate-pwa-icons.ts, which this file's generator mirrors),
 * rather than the Next.js/framework default icon.
 */

const PRIMARY = { r: 0x00, g: 0x6b, b: 0xab }; // --primary, see lib/pwa/colors.ts
const PRIMARY_FOREGROUND = { r: 0xfa, g: 0xfa, b: 0xfa }; // --primary-foreground

type IcoEntry = { width: number; height: number; data: Buffer };

function parseIco(buffer: Buffer): IcoEntry[] {
  expect(buffer.readUInt16LE(0)).toBe(0); // reserved
  expect(buffer.readUInt16LE(2)).toBe(1); // type: icon
  const count = buffer.readUInt16LE(4);

  const entries: IcoEntry[] = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    const rawWidth = buffer.readUInt8(base);
    const rawHeight = buffer.readUInt8(base + 1);
    const byteSize = buffer.readUInt32LE(base + 8);
    const offset = buffer.readUInt32LE(base + 12);
    entries.push({
      width: rawWidth === 0 ? 256 : rawWidth,
      height: rawHeight === 0 ? 256 : rawHeight,
      data: buffer.subarray(offset, offset + byteSize),
    });
  }
  return entries;
}

describe("app/favicon.ico", () => {
  const buffer = readFileSync(path.join(__dirname, "favicon.ico"));
  const entries = parseIco(buffer);

  it("bundles 16x16 and 32x32 images", () => {
    const sizes = entries.map((entry) => `${entry.width}x${entry.height}`).sort();
    expect(sizes).toEqual(["16x16", "32x32"]);
  });

  it("draws the brand-primary rounded square with the diamond mark cut out in the foreground color", () => {
    for (const entry of entries) {
      const png = PNG.sync.read(entry.data);
      const half = entry.width / 2;

      // Dead center: inside the diamond -> primary-foreground.
      const centerIdx = (png.width * half + half) << 2;
      expect([
        png.data[centerIdx],
        png.data[centerIdx + 1],
        png.data[centerIdx + 2],
      ]).toEqual([PRIMARY_FOREGROUND.r, PRIMARY_FOREGROUND.g, PRIMARY_FOREGROUND.b]);

      // Near the right edge but still inside the rounded square, past the
      // diamond's tip: primary.
      const nearEdgeX = entry.width - 3;
      const nearEdgeIdx = (png.width * half + nearEdgeX) << 2;
      expect([
        png.data[nearEdgeIdx],
        png.data[nearEdgeIdx + 1],
        png.data[nearEdgeIdx + 2],
      ]).toEqual([PRIMARY.r, PRIMARY.g, PRIMARY.b]);

      // Outer corner: outside the rounded square -> transparent.
      const cornerIdx = 0;
      expect(png.data[cornerIdx + 3]).toBe(0);
    }
  });
});
