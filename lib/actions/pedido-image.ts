"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

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

export type UploadPedidoImageResult =
  | { success: true; path: string }
  | { success: false; error: string };

/**
 * Uploads the customer's Pedido reference image (business-rules.md#load-removal)
 * to the dedicated `removal-pedidos` Supabase Storage bucket, as the
 * currently authenticated operator (so the request runs through the
 * bucket's RLS policy, same posture as the app's table policies). Returns
 * the object path to be persisted on the removal row — never the image
 * bytes.
 */
export async function uploadPedidoImage(
  formData: FormData,
): Promise<UploadPedidoImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
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
  const { error } = await supabase.storage
    .from(PEDIDO_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return {
      success: false,
      error: "Falha ao enviar a imagem do Pedido. Tente novamente.",
    };
  }

  return { success: true, path };
}

/** How long a receipt's signed Pedido image URL stays valid — long enough to view/print/share the receipt in one sitting. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Generates a short-lived signed URL for a Pedido image already stored in
 * the private `removal-pedidos` bucket, so the printable removal receipt
 * (issue #270) can render it without making the bucket public. Runs as the
 * currently authenticated operator, same posture as `uploadPedidoImage`.
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
