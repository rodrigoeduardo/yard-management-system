import { z } from "zod";

const itemQrPayloadSchema = z.object({
  identifier: z.string(),
  material: z.string(),
  weight: z.string(),
});

export type ItemQrPayload = z.infer<typeof itemQrPayloadSchema>;

export function buildItemQrPayload(params: {
  itemIndex: number;
  notaFiscal: string;
  material: string;
  weight: string;
}): ItemQrPayload {
  return {
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
