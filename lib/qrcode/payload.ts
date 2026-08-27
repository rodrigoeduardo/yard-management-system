import { z } from "zod";

/**
 * A QR code is write-once: whatever it carries is frozen at print time, while
 * the item's own data (weight, corrida, …) keeps changing in the database.
 * So the code carries *identity only* — the item's `qr_token` — and every
 * scan-time reader resolves the current values from the database.
 *
 * Unknown keys are stripped rather than rejected, which is what keeps labels
 * printed in the old format (material/weight/corrida embedded) scannable:
 * they still parse, and their stale fields are dropped on the way in.
 */
const itemQrPayloadSchema = z.object({
  qrToken: z.uuid(),
});

export type ItemQrPayload = z.infer<typeof itemQrPayloadSchema>;

export function encodeItemQrPayload(payload: ItemQrPayload): string {
  return JSON.stringify(payload);
}

export function decodeItemQrPayload(text: string): ItemQrPayload {
  return itemQrPayloadSchema.parse(JSON.parse(text));
}

/** Like `decodeItemQrPayload`, but returns null instead of throwing on invalid input (e.g. a scanned code that isn't an item QR). */
export function safeDecodeItemQrPayload(text: string): ItemQrPayload | null {
  try {
    return decodeItemQrPayload(text);
  } catch {
    return null;
  }
}
