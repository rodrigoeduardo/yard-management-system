/**
 * Core logic for the realistic demo dataset seed script (see
 * `scripts/seed-demo-dataset.ts` for the CLI entry point and usage docs).
 *
 * Fixed, deterministic, PT-BR sample data — reused by the nightly demo
 * reset job (ADR 0003) and for populating a fresh local Supabase stack
 * during development. Kept separate from the CLI wrapper so it can be
 * unit/integration tested directly (see `demo-dataset.test.ts`).
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sumDecimalStrings } from "@/lib/db/decimal";
import { insertLoadWithItems } from "@/lib/db/loads";
import { removeScannedItems } from "@/lib/db/removals";
import { items, loads, removals } from "@/lib/db/schema";

export type DemoLoadSpec = {
  /** Plausible Nota Fiscal number; also the idempotency key for this load. */
  notaFiscal: string;
  /** Ordem de Transporte read off the inbound paperwork alongside the NF. */
  transportOrder: string;
  /** Inbound driver — distinct from the removal (outbound) driver. */
  driver: string;
  material: string;
  entryDaysAgo: number;
  itemWeights: string[];
  itemCorridas: string[];
};

/**
 * Fixed pool of plausible PT-BR inbound driver names, picked deterministically
 * by index so re-running the seed script never changes previously-inserted
 * data.
 */
const DEMO_LOAD_DRIVERS = [
  "Antônio Carlos Pereira",
  "Francisco das Chagas Silva",
  "Raimundo Nonato Alves",
  "Sebastião Gomes Rocha",
  "Vanderlei José Santos",
  "Wellington Braga Costa",
];

function demoLoadDriver(index: number): string {
  return DEMO_LOAD_DRIVERS[index % DEMO_LOAD_DRIVERS.length];
}

/** Deterministic Ordem de Transporte derived from the load's Nota Fiscal. */
function demoTransportOrder(notaFiscal: string): string {
  return `OT-${notaFiscal.slice(-6)}`;
}

export type DemoRemovalTarget = {
  notaFiscal: string;
  /** How many of the load's oldest still-in-stock items this removal takes. */
  count: number;
};

export type DemoRemovalSpec = {
  /** Also the idempotency key for this removal (see `seedDemoDataset`). */
  driver: string;
  vehiclePlate: string;
  exitDaysAgo: number;
  /** More than one entry exercises the multi-load removal invariant. */
  targets: DemoRemovalTarget[];
};

function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 86_400_000);
}

/**
 * Deterministic, varying, positive per-item weights (2 decimals) so
 * re-running the seed script never changes previously-inserted data.
 */
function demoItemWeights(seed: number, count: number): string[] {
  return Array.from({ length: count }, (_, itemIndex) => {
    const grams = 850 + ((seed * 617 + itemIndex * 271) % 2200);
    return (grams / 1000).toFixed(2);
  });
}

/**
 * Deterministic per-item Corrida values, same seeding strategy as
 * `demoItemWeights` — stable across re-runs of the seed script (#307).
 */
function demoItemCorridas(seed: number, count: number): string[] {
  return Array.from({ length: count }, (_, itemIndex) => {
    const heat = 4000 + ((seed * 613 + itemIndex * 97) % 5000);
    return `C-${heat}`;
  });
}

/** NF of the one load seeded fully removed (item_count = 0, remaining_weight = 0). */
export const FINISHED_LOAD_NOTA_FISCAL = "000123460";

/** Driver of the removal that spans items from more than one load. */
export const MULTI_LOAD_REMOVAL_DRIVER = "Marcos Antônio Souza";

export const DEMO_LOADS: DemoLoadSpec[] = [
  {
    notaFiscal: "000123456",
    transportOrder: demoTransportOrder("000123456"),
    driver: demoLoadDriver(1),
    material: "Sucata de Ferro",
    entryDaysAgo: 14,
    itemWeights: demoItemWeights(1, 16),
    itemCorridas: demoItemCorridas(1, 16),
  },
  {
    notaFiscal: "000123457",
    transportOrder: demoTransportOrder("000123457"),
    driver: demoLoadDriver(2),
    material: "Alumínio",
    entryDaysAgo: 13,
    itemWeights: demoItemWeights(2, 17),
    itemCorridas: demoItemCorridas(2, 17),
  },
  {
    notaFiscal: "000123458",
    transportOrder: demoTransportOrder("000123458"),
    driver: demoLoadDriver(3),
    material: "Cobre",
    entryDaysAgo: 12,
    itemWeights: demoItemWeights(3, 15),
    itemCorridas: demoItemCorridas(3, 15),
  },
  {
    notaFiscal: "000123459",
    transportOrder: demoTransportOrder("000123459"),
    driver: demoLoadDriver(4),
    material: "Papelão Ondulado",
    entryDaysAgo: 11,
    itemWeights: demoItemWeights(4, 18),
    itemCorridas: demoItemCorridas(4, 18),
  },
  {
    notaFiscal: FINISHED_LOAD_NOTA_FISCAL,
    transportOrder: demoTransportOrder(FINISHED_LOAD_NOTA_FISCAL),
    driver: demoLoadDriver(5),
    material: "Plástico PET",
    entryDaysAgo: 10,
    itemWeights: demoItemWeights(5, 15),
    itemCorridas: demoItemCorridas(5, 15),
  },
  {
    notaFiscal: "000123461",
    transportOrder: demoTransportOrder("000123461"),
    driver: demoLoadDriver(6),
    material: "Sucata de Aço Inox",
    entryDaysAgo: 9,
    itemWeights: demoItemWeights(6, 16),
    itemCorridas: demoItemCorridas(6, 16),
  },
];

export const DEMO_REMOVALS: DemoRemovalSpec[] = [
  {
    driver: "Carlos Eduardo Ferreira",
    vehiclePlate: "BRA2E19",
    exitDaysAgo: 5,
    targets: [{ notaFiscal: "000123458", count: 5 }],
  },
  {
    // Scans items from two different loads (Cobre + Papelão Ondulado) in a
    // single removal action — the multi-load removal invariant.
    driver: MULTI_LOAD_REMOVAL_DRIVER,
    vehiclePlate: "PBB4A56",
    exitDaysAgo: 3,
    targets: [
      { notaFiscal: "000123458", count: 3 },
      { notaFiscal: "000123459", count: 4 },
    ],
  },
  {
    // Takes every item on the Plástico PET load, finishing it.
    driver: "José Ricardo Lima",
    vehiclePlate: "RIO3F45",
    exitDaysAgo: 1,
    targets: [{ notaFiscal: FINISHED_LOAD_NOTA_FISCAL, count: 15 }],
  },
];

export type DemoSeedSummary = {
  loadsCreated: number;
  loadsSkipped: number;
  removalsCreated: number;
  removalsSkipped: number;
};

/**
 * Idempotently seeds the fixed demo dataset. Loads are keyed by their Nota
 * Fiscal, removals by their driver name — both already exist means this run
 * skips them, so re-running never duplicates rows or errors.
 *
 * Uses the same insert helpers the app itself uses
 * (`insertLoadWithItems`, `removeScannedItems`) with no acting user, so the
 * usual audit_log triggers fire (`audit_log.user_id` is NULL for these
 * system-seeded rows).
 */
export async function seedDemoDataset(
  now: Date = new Date(),
): Promise<DemoSeedSummary> {
  let loadsCreated = 0;
  let loadsSkipped = 0;

  for (const spec of DEMO_LOADS) {
    const [existing] = await db
      .select({ id: loads.id })
      .from(loads)
      .where(eq(loads.notaFiscal, spec.notaFiscal));

    if (existing) {
      loadsSkipped += 1;
      continue;
    }

    await insertLoadWithItems({
      notaFiscal: spec.notaFiscal,
      transportOrder: spec.transportOrder,
      driver: spec.driver,
      entryDate: daysAgo(spec.entryDaysAgo, now),
      // Consistent with the per-item weights (business rules only require
      // consistency, not that NF weight equal the item-weight sum).
      nfWeight: sumDecimalStrings(spec.itemWeights),
      material: spec.material,
      itemWeights: spec.itemWeights,
      itemCorridas: spec.itemCorridas,
    });
    loadsCreated += 1;
  }

  let removalsCreated = 0;
  let removalsSkipped = 0;

  for (const spec of DEMO_REMOVALS) {
    const [existing] = await db
      .select({ id: removals.id })
      .from(removals)
      .where(eq(removals.driver, spec.driver));

    if (existing) {
      removalsSkipped += 1;
      continue;
    }

    const qrTokens: string[] = [];
    for (const target of spec.targets) {
      const [load] = await db
        .select({ id: loads.id })
        .from(loads)
        .where(eq(loads.notaFiscal, target.notaFiscal));
      if (!load) {
        throw new Error(
          `seedDemoDataset: load with NF "${target.notaFiscal}" not found for removal "${spec.driver}".`,
        );
      }

      const availableItems = await db
        .select({ qrToken: items.qrToken })
        .from(items)
        .where(and(eq(items.loadId, load.id), eq(items.status, "in_stock")))
        .orderBy(asc(items.sequence))
        .limit(target.count);

      if (availableItems.length < target.count) {
        throw new Error(
          `seedDemoDataset: load "${target.notaFiscal}" has fewer than ${target.count} in-stock items for removal "${spec.driver}".`,
        );
      }

      qrTokens.push(...availableItems.map((item) => item.qrToken));
    }

    await removeScannedItems({
      exitDate: daysAgo(spec.exitDaysAgo, now),
      driver: spec.driver,
      vehiclePlate: spec.vehiclePlate,
      // Seed data has no real attached Pedido image (issue #269) — a fixed
      // placeholder path keeps this idempotent seeding path type-correct
      // without implying a real Storage object exists.
      pedidoImagePath: "removal-pedidos/seed-placeholder.jpg",
      qrTokens,
    });
    removalsCreated += 1;
  }

  return { loadsCreated, loadsSkipped, removalsCreated, removalsSkipped };
}
