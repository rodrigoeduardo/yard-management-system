import { createPedidoImageUploadTarget } from "@/lib/actions/pedido-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { compressPedidoImage } from "./pedido-image-compression";

const PEDIDO_IMAGES_BUCKET = "removal-pedidos";

const UPLOAD_FAILED_ERROR =
  "Falha ao enviar a imagem do Pedido. Tente novamente.";

export type UploadPedidoImageResult =
  | { success: true; path: string }
  | { success: false; error: string };

/**
 * Uploads the Pedido image from the browser straight to Supabase Storage:
 * the server validates the file's metadata and hands back a signed upload
 * target, then the bytes go directly to the bucket — never through a
 * Server Action body (#360). The image is compressed first (#362), so the
 * metadata the server validates describes the bytes actually sent. Any
 * failure, thrown or returned, resolves to an inline error so the removal
 * form keeps its input for a retry.
 */
export async function uploadPedidoImage(
  original: File,
): Promise<UploadPedidoImageResult> {
  try {
    const file = await compressPedidoImage(original);
    const target = await createPedidoImageUploadTarget({
      type: file.type,
      size: file.size,
    });
    if (!target.success) {
      return target;
    }

    const { error } = await createSupabaseBrowserClient()
      .storage.from(PEDIDO_IMAGES_BUCKET)
      .uploadToSignedUrl(target.path, target.token, file, {
        contentType: file.type,
      });
    if (error) {
      return { success: false, error: UPLOAD_FAILED_ERROR };
    }

    return { success: true, path: target.path };
  } catch {
    return { success: false, error: UPLOAD_FAILED_ERROR };
  }
}
