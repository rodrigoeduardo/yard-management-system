import type { ItemQrPayload } from "../qrcode/payload";

export type AddScannedItemResult = {
  list: ItemQrPayload[];
  error?: string;
};

export function addScannedItem(
  list: ItemQrPayload[],
  item: ItemQrPayload,
): AddScannedItemResult {
  if (list.some((scanned) => scanned.qrToken === item.qrToken)) {
    return { list, error: "Este item já foi escaneado nesta remoção." };
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
  list: ItemQrPayload[],
  qrToken: string,
): ItemQrPayload[] {
  return list.filter((item) => item.qrToken !== qrToken);
}

export type ScannedItemsByNotaFiscal = {
  notaFiscal: string;
  items: ItemQrPayload[];
};

/** Recovers the Nota Fiscal embedded in an item's identifier (e.g. "Item 1 - NF-100" -> "NF-100"). */
function notaFiscalFromIdentifier(identifier: string): string {
  return identifier.replace(/^Item \d+ - /, "");
}

/**
 * Resolves an item's Nota Fiscal: prefers the distinct `notaFiscal` field,
 * falling back to parsing the identifier for QR codes printed before that
 * field existed.
 */
export function notaFiscalOf(item: ItemQrPayload): string {
  return item.notaFiscal ?? notaFiscalFromIdentifier(item.identifier);
}

/** Recovers the item's own number embedded in its identifier (e.g. "Item 7 - NF-100" -> 7). */
function itemNumberFromIdentifier(identifier: string): number | null {
  const match = identifier.match(/^Item (\d+) - /);
  return match ? Number(match[1]) : null;
}

/**
 * Resolves an item's own number (the one printed on its physical label).
 * The QR payload has no distinct numeric field, so this always parses the
 * identifier; returns null when the identifier doesn't match the expected
 * shape so callers can fall back to displaying the raw identifier.
 */
export function itemNumberOf(item: ItemQrPayload): number | null {
  return itemNumberFromIdentifier(item.identifier);
}

/** Groups scanned items by their originating Nota Fiscal, preserving first-seen order. */
export function groupScannedItemsByNotaFiscal(
  list: ItemQrPayload[],
): ScannedItemsByNotaFiscal[] {
  const groups: ScannedItemsByNotaFiscal[] = [];

  for (const item of list) {
    const notaFiscal = notaFiscalOf(item);
    const group = groups.find((g) => g.notaFiscal === notaFiscal);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ notaFiscal, items: [item] });
    }
  }

  return groups;
}
