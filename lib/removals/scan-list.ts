import type { ScannedItem } from "./scanned-item";

export const SCANNED_ITEM_ALREADY_ADDED_ERROR =
  "Este item já foi escaneado nesta remoção.";

export type AddScannedItemResult = {
  list: ScannedItem[];
  error?: string;
};

/** True when `qrToken` is already on the running list. */
export function hasScannedItem(
  list: ScannedItem[],
  qrToken: string,
): boolean {
  return list.some((scanned) => scanned.qrToken === qrToken);
}

export function addScannedItem(
  list: ScannedItem[],
  item: ScannedItem,
): AddScannedItemResult {
  if (hasScannedItem(list, item.qrToken)) {
    return { list, error: SCANNED_ITEM_ALREADY_ADDED_ERROR };
  }

  return { list: [...list, item] };
}

export type ScanCooldown = {
  /**
   * True while `qrToken` is the token most recently accepted and its
   * cooldown window is still active.
   */
  isActive: (qrToken: string) => boolean;
  /** Starts (or restarts) the cooldown window for `qrToken` from now. */
  start: (qrToken: string) => void;
};

/**
 * Tracks a short time-based cooldown after a successful scan, keyed to the
 * accepted token so scanning a *different* item right after is never
 * blocked.
 *
 * The continuous @zxing/browser decoder keeps re-reading whatever code is in
 * frame, including the one that was just accepted. The `pendingTokensRef`
 * in-flight lock only prevents duplicate *concurrent* reads while a status
 * check is pending; it does nothing once that check resolves, so the very
 * next decoded frame for the same code would otherwise be treated as a new
 * scan and rejected as "already scanned". This cooldown ignores further
 * reads of that same token for `durationMs` after it was accepted,
 * independent of that lock. Once the cooldown expires, scanning the same
 * (already-added) item again still surfaces "already scanned" as usual.
 */
export function createScanCooldown(durationMs: number): ScanCooldown {
  let lastAcceptedToken: string | undefined;
  let activeUntil = 0;

  return {
    isActive(qrToken: string): boolean {
      return qrToken === lastAcceptedToken && Date.now() < activeUntil;
    },
    start(qrToken: string): void {
      lastAcceptedToken = qrToken;
      activeUntil = Date.now() + durationMs;
    },
  };
}

/** Removes the scanned item matching `qrToken`, if present. */
export function dropScannedItem(
  list: ScannedItem[],
  qrToken: string,
): ScannedItem[] {
  return list.filter((item) => item.qrToken !== qrToken);
}

export type ScannedItemsByNotaFiscal = {
  notaFiscal: string;
  items: ScannedItem[];
};

/** Groups scanned items by their originating Nota Fiscal, preserving first-seen order. */
export function groupScannedItemsByNotaFiscal(
  list: ScannedItem[],
): ScannedItemsByNotaFiscal[] {
  const groups: ScannedItemsByNotaFiscal[] = [];

  for (const item of list) {
    const group = groups.find((g) => g.notaFiscal === item.notaFiscal);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ notaFiscal: item.notaFiscal, items: [item] });
    }
  }

  return groups;
}
