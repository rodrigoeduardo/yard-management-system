"use server";

import { z } from "zod";
import { getItemStatusByQrToken } from "@/lib/db/items";

const checkItemStatusSchema = z.uuid();

export async function checkItemStatus(qrToken: string) {
  const parsed = checkItemStatusSchema.safeParse(qrToken);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten() };
  }

  const status = await getItemStatusByQrToken(parsed.data);

  return { success: true as const, status: status ?? ("not_found" as const) };
}
