import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { VIEWER_WRITE_ERROR_MESSAGE } from "./guard";

// Viewer session for every module under test below.
vi.mock("@/lib/auth/current-role", () => ({
  getCurrentUserRole: vi.fn(async () => "viewer"),
}));
vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUserId: vi.fn(async () => "user-id"),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}));

const insertLoadWithItemsMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/loads", () => ({
  insertLoadWithItems: insertLoadWithItemsMock,
}));

const createMaterialMock = vi.hoisted(() => vi.fn());
const renameMaterialMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/materials", () => ({
  createMaterial: createMaterialMock,
  renameMaterial: renameMaterialMock,
  MaterialNameConflictError: class MaterialNameConflictError extends Error {},
}));

const removeScannedItemsMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/removals", () => ({
  removeScannedItems: removeScannedItemsMock,
}));

const storageUploadMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/ssr-server", () => ({
  createSupabaseSsrServerClient: () => ({
    storage: { from: () => ({ upload: storageUploadMock }) },
  }),
}));

/**
 * Every action module under lib/actions/, classified as either "guarded"
 * (its exports must refuse a viewer session before any database access —
 * asserted below) or "exempt" (a read, intentionally left open to viewers —
 * business-rules.md#registration-auth requires viewers can read the whole
 * app). The directory-listing check further down fails closed when a new
 * file appears here unclassified; the per-module export check fails closed
 * when a new export appears in an already-classified file.
 */
const MODULES: Record<string, { guarded: string[]; exempt: string[] }> = {
  "./item-status": { guarded: [], exempt: ["checkItemStatus"] },
  "./load-items": { guarded: [], exempt: ["fetchLoadItems"] },
  "./removal-items": { guarded: [], exempt: ["fetchRemovalItems"] },
  "./loads": { guarded: ["createLoad"], exempt: [] },
  "./materials": {
    guarded: ["createMaterialAction", "renameMaterialAction"],
    exempt: [],
  },
  "./removals": { guarded: ["removeItems"], exempt: [] },
  "./removal-cancel": { guarded: ["cancelRemovalAction"], exempt: [] },
  "./pedido-image": {
    guarded: ["uploadPedidoImage"],
    exempt: ["getPedidoImageSignedUrl"],
  },
};

const actionsDir = path.dirname(fileURLToPath(import.meta.url));

function listActionModules(): string[] {
  return readdirSync(actionsDir)
    .filter((name) => name.endsWith(".ts"))
    .filter((name) => !name.endsWith(".test.ts"))
    .filter((name) => name !== "guard.ts")
    .map((name) => `./${name.replace(/\.ts$/, "")}`)
    .sort();
}

describe("lib/actions guard coverage", () => {
  it("classifies every action file in the directory (fails when a new file is added unclassified)", () => {
    expect(listActionModules()).toEqual(Object.keys(MODULES).sort());
  });

  for (const [modulePath, { guarded, exempt }] of Object.entries(MODULES)) {
    it(`${modulePath} exports exactly its classified guarded+exempt actions (fails when a new export is added unclassified)`, async () => {
      const mod = await import(modulePath);
      expect(Object.keys(mod).sort()).toEqual(
        [...guarded, ...exempt].sort(),
      );
    });
  }

  // Behavioral proof: every guarded action, called under a viewer session,
  // is refused before touching the database.
  const guardedCases: [string, () => Promise<unknown>][] = [
    [
      "createLoad",
      async () => {
        const { createLoad } = await import("./loads");
        return createLoad({
          notaFiscal: "NF-1",
          transportOrder: "OT-000001",
          driver: "João da Silva",
          nfDate: "2026-01-01",
          entryDateTime: "2026-01-01T09:00",
          nfWeight: 100,
          material: "Aço",
          itemWeights: [10],
          itemCorridas: ["C-1"],
        });
      },
    ],
    [
      "createMaterialAction",
      async () => {
        const { createMaterialAction } = await import("./materials");
        return createMaterialAction({ name: "Aço" });
      },
    ],
    [
      "renameMaterialAction",
      async () => {
        const { renameMaterialAction } = await import("./materials");
        return renameMaterialAction({
          id: "00000000-0000-0000-0000-000000000000",
          name: "Aço",
        });
      },
    ],
    [
      "removeItems",
      async () => {
        const { removeItems } = await import("./removals");
        return removeItems({
          exitDateTime: "2026-01-01T09:00",
          driver: "Driver",
          vehiclePlate: "ABC1D23",
          pedidoImagePath: "path.jpg",
          qrTokens: ["00000000-0000-0000-0000-000000000000"],
        });
      },
    ],
    [
      "uploadPedidoImage",
      async () => {
        const { uploadPedidoImage } = await import("./pedido-image");
        return uploadPedidoImage(new FormData());
      },
    ],
  ];

  for (const [name, run] of guardedCases) {
    it(`${name} refuses a viewer session with a PT-BR error before any database access`, async () => {
      const result = (await run()) as
        | { success: false; error: unknown }
        | { success: true };

      expect(result.success).toBe(false);
      if (result.success) throw new Error("expected refusal");
      const message = JSON.stringify(result.error);
      expect(message).toContain(VIEWER_WRITE_ERROR_MESSAGE);

      expect(insertLoadWithItemsMock).not.toHaveBeenCalled();
      expect(createMaterialMock).not.toHaveBeenCalled();
      expect(renameMaterialMock).not.toHaveBeenCalled();
      expect(removeScannedItemsMock).not.toHaveBeenCalled();
      expect(storageUploadMock).not.toHaveBeenCalled();
    });
  }
});
