// Turns the real QR PNG captured by load-intake.spec.ts into a YUV4MPEG2
// (.y4m) clip Chromium can play back as a fake webcam
// (--use-file-for-fake-video-capture). The removal flow's live scanner then
// decodes it exactly as it would a real camera frame — no mocked payload.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const CLIPS_DIR = path.resolve(import.meta.dirname, "../clips");
const HANDOFF_PATH = path.join(CLIPS_DIR, "qr-handoff.json");
const OUT_PATH = path.join(CLIPS_DIR, "qr-feed.y4m");

const FPS = 15;
const SECONDS = 4;

function rgbaToYuv420(png) {
  // Even dimensions are required for 4:2:0 chroma subsampling; a QR code's
  // built-in quiet zone means trimming a stray odd row/column is harmless.
  const width = png.width - (png.width % 2);
  const height = png.height - (png.height % 2);
  const y = new Uint8Array(width * height);
  const u = new Uint8Array((width / 2) * (height / 2));
  const v = new Uint8Array((width / 2) * (height / 2));

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * png.width + px) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      y[py * width + px] = clamp(0.299 * r + 0.587 * g + 0.114 * b);
    }
  }

  for (let cy = 0; cy < height / 2; cy++) {
    for (let cx = 0; cx < width / 2; cx++) {
      const px = cx * 2;
      const py = cy * 2;
      const idx = (py * png.width + px) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const ci = cy * (width / 2) + cx;
      u[ci] = clamp(-0.169 * r - 0.331 * g + 0.5 * b + 128);
      v[ci] = clamp(0.5 * r - 0.419 * g - 0.081 * b + 128);
    }
  }

  return { width, height, y, u, v };
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

const { dataUrl } = JSON.parse(readFileSync(HANDOFF_PATH, "utf8"));
const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
const png = PNG.sync.read(Buffer.from(base64, "base64"));
const frame = rgbaToYuv420(png);

const header = `YUV4MPEG2 W${frame.width} H${frame.height} F${FPS}:1 Ip A1:1 C420jpeg\n`;
const frameHeader = Buffer.from("FRAME\n");
const frameBuffer = Buffer.concat([
  frameHeader,
  Buffer.from(frame.y),
  Buffer.from(frame.u),
  Buffer.from(frame.v),
]);

const chunks = [Buffer.from(header)];
for (let i = 0; i < FPS * SECONDS; i++) chunks.push(frameBuffer);

writeFileSync(OUT_PATH, Buffer.concat(chunks));
console.log(`wrote ${OUT_PATH} (${frame.width}x${frame.height}, ${FPS * SECONDS} frames)`);
