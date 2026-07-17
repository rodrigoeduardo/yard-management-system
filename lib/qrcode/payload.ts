import { z } from "zod";

const itemQrPayloadSchema = z.object({
  qrToken: z.uuid(),
  identifier: z.string(),
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
