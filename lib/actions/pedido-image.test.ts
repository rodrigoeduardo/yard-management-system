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

// `uploadPedidoImage` reads the acting user's session via `next/headers`
// cookies (same pattern as lib/auth/current-user.ts) so the upload runs
// through Supabase Storage's RLS as the authenticated operator, not an
// anonymous request. Sign in against the same mocked cookie store before
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

let uploadPedidoImage: typeof import("./pedido-image").uploadPedidoImage;
let getPedidoImageSignedUrl: typeof import("./pedido-image").getPedidoImageSignedUrl;
beforeAll(async () => {
  ({ uploadPedidoImage, getPedidoImageSignedUrl } = await import(
    "./pedido-image"
  ));
});

describe("uploadPedidoImage", () => {
  it("rejects when no file is attached", async () => {
    const formData = new FormData();

    const result = await uploadPedidoImage(formData);

    expect(result.success).toBe(false);
  });

  it("rejects an unsupported file type", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["not an image"], "pedido.txt", { type: "text/plain" }),
    );

    const result = await uploadPedidoImage(formData);

    expect(result.success).toBe(false);
  });

  it("rejects a file over the size limit", async () => {
    const formData = new FormData();
    const oversized = new Uint8Array(21 * 1024 * 1024);
    formData.set(
      "file",
      new File([oversized], "pedido-large.png", { type: "image/png" }),
    );

    const result = await uploadPedidoImage(formData);

    expect(result.success).toBe(false);
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

    it("uploads the image to the removal-pedidos bucket and returns its object path", async () => {
      const formData = new FormData();
      formData.set("file", pngFile());

      const result = await uploadPedidoImage(formData);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      uploadedPaths.push(result.path);

      const { data, error } = await authedClient.storage
        .from("removal-pedidos")
        .download(result.path);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    it("returns a fetchable signed URL for the uploaded image, for the printable receipt (#270)", async () => {
      const formData = new FormData();
      formData.set("file", pngFile("pedido-signed-url.png"));

      const uploadResult = await uploadPedidoImage(formData);
      expect(uploadResult.success).toBe(true);
      if (!uploadResult.success) throw new Error("expected success");
      uploadedPaths.push(uploadResult.path);

      const signedUrl = await getPedidoImageSignedUrl(uploadResult.path);

      expect(signedUrl).not.toBeNull();
      const response = await fetch(signedUrl!);
      expect(response.ok).toBe(true);
    });
  });
});
