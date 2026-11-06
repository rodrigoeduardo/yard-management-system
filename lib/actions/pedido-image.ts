"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";
import { isViewerWriteRefused, VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

const PEDIDO_IMAGES_BUCKET = "removal-pedidos";

/** Keep in sync with the bucket's `allowed_mime_types` (see
 * drizzle/0010_removal_pedidos_storage_bucket.sql). */
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MiB — matches the bucket's file_size_limit.

export type PedidoImageMetadata = { type: string; size: number };

export type PedidoImageUploadTargetResult =
  | { success: true; path: string; token: string }
  | { success: false; error: string };

/**
 * Validates the customer's Pedido reference image
 * (business-rules.md#load-removal) by its metadata and returns a signed
 * upload target in the dedicated `removal-pedidos` Supabase Storage bucket.
 * The browser then uploads the bytes straight to Storage
 * (lib/removals/pedido-image-upload.ts): sending them through a Server
 * Action hits Next.js's 1 MB action body limit — and Vercel's 4.5 MB
 * function body cap behind it — so a phone photo crashed the page (#360).
 *
 * The signed URL is created as the currently authenticated operator, so the
 * bucket's RLS policy still gates who may upload. The returned `path` is
 * what gets persisted on the removal row — never the image bytes.
 */
export async function createPedidoImageUploadTarget(
  file: PedidoImageMetadata,
): Promise<PedidoImageUploadTargetResult> {
  if (await isViewerWriteRefused()) {
    return { success: false, error: VIEWER_WRITE_ERROR_MESSAGE };
  }

  if (file.size <= 0) {
    return { success: false, error: "Anexe a imagem do Pedido." };
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type];
  if (!extension) {
    return {
      success: false,
      error: "Formato de imagem não suportado. Use JPEG, PNG, WEBP ou HEIC.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: "Imagem muito grande. O limite é 20MB.",
    };
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);

  const path = `${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(PEDIDO_IMAGES_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      success: false,
      error: "Falha ao enviar a imagem do Pedido. Tente novamente.",
    };
  }

  return { success: true, path: data.path, token: data.token };
}

/** How long a receipt's signed Pedido image URL stays valid — long enough to view/print/share the receipt in one sitting. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Generates a short-lived signed URL for a Pedido image already stored in
 * the private `removal-pedidos` bucket, so the printable removal receipt
 * (issue #270) can render it without making the bucket public. Runs as the
 * currently authenticated operator, same posture as
 * `createPedidoImageUploadTarget`.
 * Returns null if the object can't be signed (e.g. it was deleted).
 */
export async function getPedidoImageSignedUrl(
  path: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createSupabaseSsrServerClient(cookieStore);

  const { data, error } = await supabase.storage
    .from(PEDIDO_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
