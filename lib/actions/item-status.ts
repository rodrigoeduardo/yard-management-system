"use server";

import { z } from "zod";
import { getItemScanSnapshotByQrToken } from "@/lib/db/items";

const checkItemStatusSchema = z.uuid();

/**
 * Resolves a scanned `qr_token` against the database. The QR code carries the
 * token and nothing else, so this is what supplies the item's *current*
 * material, weight, corrida and NF to the removal flow — a label printed
 * before a weight correction still scans to the corrected weight.
 */
export async function checkItemStatus(qrToken: string) {
  const parsed = checkItemStatusSchema.safeParse(qrToken);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const snapshot = await getItemScanSnapshotByQrToken(parsed.data);
  if (!snapshot) {
    return { success: true as const, status: "not_found" as const };
  }

  const { status, ...item } = snapshot;

  return { success: true as const, status, item };
}
