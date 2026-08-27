/**
 * The human-readable text printed next to an item's QR code. It is *not* part
 * of the QR payload (see `payload.ts`): the code carries identity only, and
 * this is rendered from the item's database row at print time.
 */
export type ItemQrLabel = {
  /** "Item <number> - <NF>", the item's printed name. */
  identifier: string;
  notaFiscal: string;
  material: string;
  weight: string;
  corrida?: string;
};

export function buildItemQrLabel(params: {
  itemNumber: number;
  notaFiscal: string;
  material: string;
  weight: string;
  corrida?: string | null;
}): ItemQrLabel {
  return {
    identifier: `Item ${params.itemNumber} - ${params.notaFiscal}`,
    notaFiscal: params.notaFiscal,
    material: params.material,
    weight: params.weight,
    ...(params.corrida ? { corrida: params.corrida } : {}),
  };
}
