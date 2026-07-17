import { eq } from "drizzle-orm";
import { db } from "./index";
import { items } from "./schema";

export async function getItemStatusByQrToken(
  qrToken: string,
): Promise<"in_stock" | "removed" | null> {
  const [item] = await db
    .select({ status: items.status })
    .from(items)
    .where(eq(items.qrToken, qrToken));

  return item?.status ?? null;
}
