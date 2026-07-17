export function isLoadFinished(load: {
  itemCount: number;
  remainingWeight: string;
}): boolean {
  return load.itemCount === 0 && Number(load.remainingWeight) === 0;
}
