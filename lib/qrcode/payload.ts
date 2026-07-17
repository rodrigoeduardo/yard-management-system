import { z } from "zod";

const itemQrPayloadSchema = z.object({
  qrToken: z.uuid(),
  identifier: z.string(),
  // Optional so decoding already-printed QR codes (issued before this field
  // existed) keeps working. New codes always carry it via buildItemQrPayload.
  notaFiscal: z.string().optional(),
  material: z.string(),
  weight: z.string(),
});

export type ItemQrPayload = z.infer<typeof itemQrPayloadSchema>;

export function buildItemQrPayload(params: {
  qrToken: string;
  itemIndex: number;
  notaFiscal: string;
  material: string;
  weight: string;
}): ItemQrPayload {
  return {
    qrToken: params.qrToken,
    identifier: `Item ${params.itemIndex} - ${params.notaFiscal}`,
    notaFiscal: params.notaFiscal,
    material: params.material,
    weight: params.weight,
  };
}

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
