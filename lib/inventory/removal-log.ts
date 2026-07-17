export type RemovalNfRow = {
  removalId: string;
  notaFiscal: string;
};

export function groupNfsByRemoval(rows: RemovalNfRow[]): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const { removalId, notaFiscal } of rows) {
    const nfs = result.get(removalId) ?? [];
    if (!nfs.includes(notaFiscal)) {
      nfs.push(notaFiscal);
    }
    result.set(removalId, nfs);
  }

  return result;
}
