import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSupabaseSsrServerClient } from "@/lib/supabase/ssr-server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function fakeCookieStore() {
  const store = new Map<string, string>();
  return {
    getAll: () =>
      Array.from(store.entries()).map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
  };
}

const cookieStore = fakeCookieStore();

// `createPedidoImageUploadTarget` reads the acting user's session via
// `next/headers` cookies (same pattern as lib/auth/current-user.ts) so the
// signed upload URL is created through Supabase Storage's RLS as the
// authenticated operator, not an anonymous request. Sign in against the same mocked cookie store before
// each authenticated test so the action inherits a real session.
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

function pngFile(name = "pedido.png"): File {
  // Minimal valid-looking bytes — Storage doesn't validate image content,
  // only the declared MIME type, which is set explicitly below.
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new File([bytes], name, { type: "image/png" });
}

let createPedidoImageUploadTarget: typeof import("./pedido-image").createPedidoImageUploadTarget;
let getPedidoImageSignedUrl: typeof import("./pedido-image").getPedidoImageSignedUrl;
beforeAll(async () => {
  ({ createPedidoImageUploadTarget, getPedidoImageSignedUrl } = await import(
    "./pedido-image"
  ));
});

describe("createPedidoImageUploadTarget", () => {
  it("rejects an empty file", async () => {
    const result = await createPedidoImageUploadTarget({
      type: "image/png",
      size: 0,
    });

    expect(result).toEqual({
      success: false,
      error: "Anexe a imagem do Pedido.",
    });
  });

  it("rejects an unsupported file type", async () => {
    const result = await createPedidoImageUploadTarget({
      type: "text/plain",
      size: 12,
    });

    expect(result).toEqual({
      success: false,
      error: "Formato de imagem não suportado. Use JPEG, PNG, WEBP ou HEIC.",
    });
  });

  it("rejects a file over the size limit", async () => {
    const result = await createPedidoImageUploadTarget({
      type: "image/png",
      size: 21 * 1024 * 1024,
    });

    expect(result).toEqual({
      success: false,
      error: "Imagem muito grande. O limite é 20MB.",
    });
  });

  describe("as an authenticated user", () => {
    const uploadedPaths: string[] = [];
    let authedClient: ReturnType<typeof createSupabaseSsrServerClient>;

    beforeAll(async () => {
      authedClient = createSupabaseSsrServerClient(cookieStore);
      const { error } = await authedClient.auth.signInWithPassword({
        email: requireEnv("TEST_USER_EMAIL"),
        password: requireEnv("TEST_USER_PASSWORD"),
      });
      if (error) {
        throw new Error(`Test user sign-in failed: ${error.message}`);
      }
    });

    afterAll(async () => {
      if (uploadedPaths.length > 0) {
        await authedClient.storage.from("removal-pedidos").remove(uploadedPaths);
      }
      await authedClient.auth.signOut();
    });

    /** Uploads through the signed target the way the browser does. */
    async function uploadThroughTarget(file: File): Promise<string> {
      const target = await createPedidoImageUploadTarget({
        type: file.type,
        size: file.size,
      });
      if (!target.success) throw new Error(`expected success: ${target.error}`);
      uploadedPaths.push(target.path);

      const { error } = await authedClient.storage
        .from("removal-pedidos")
        .uploadToSignedUrl(target.path, target.token, file, {
          contentType: file.type,
        });
      if (error) throw new Error(`signed upload failed: ${error.message}`);

      return target.path;
    }

    it("returns a signed upload target in the removal-pedidos bucket that accepts the image", async () => {
      const file = pngFile();
      const target = await createPedidoImageUploadTarget({
        type: file.type,
        size: file.size,
      });

      expect(target.success).toBe(true);
      if (!target.success) throw new Error("expected success");
      expect(target.path).toMatch(/^[0-9a-f-]{36}\.png$/);
      expect(target.token).not.toBe("");

      const path = await uploadThroughTarget(pngFile("pedido-upload.png"));
      const { data, error } = await authedClient.storage
        .from("removal-pedidos")
        .download(path);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it("accepts an image larger than the 1 MB Server Action body limit (#360)", async () => {
      const largeBytes = new Uint8Array(3 * 1024 * 1024);
      largeBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const path = await uploadThroughTarget(
        new File([largeBytes], "pedido-large.png", { type: "image/png" }),
      );

      const { data, error } = await authedClient.storage
        .from("removal-pedidos")
        .download(path);

      expect(error).toBeNull();
      expect(data?.size).toBe(largeBytes.byteLength);
    });

    it("returns a fetchable signed URL for the uploaded image, for the printable receipt (#270)", async () => {
      const path = await uploadThroughTarget(pngFile("pedido-signed-url.png"));

      const signedUrl = await getPedidoImageSignedUrl(path);

      expect(signedUrl).not.toBeNull();
      const response = await fetch(signedUrl!);
      expect(response.ok).toBe(true);
    });
  });
});
