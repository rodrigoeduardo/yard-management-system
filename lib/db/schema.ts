import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("materials_name_lower_idx").on(sql`lower(${table.name})`),
  ],
);

export const loads = pgTable("loads", {
  id: uuid("id").primaryKey().defaultRandom(),
  notaFiscal: text("nota_fiscal").notNull(),
  // Inbound transport order reference, read off the paperwork alongside the
  // NF. Nullable only because loads created before this column existed have
  // no value — new loads always require it (lib/actions/loads.ts).
  transportOrder: text("transport_order"),
  // Driver who brought the load in. Distinct from `removals.driver` (the
  // outbound driver on a removal) — disambiguated in the UI copy, not the
  // schema, per docs/specs/glossary.md. Nullable for the same pre-existing-row
  // reason as `transportOrder`.
  driver: text("driver"),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull(),
  nfWeight: numeric("nf_weight").notNull(),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  itemCount: integer("item_count").notNull().default(0),
  remainingWeight: numeric("remaining_weight").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    loadId: uuid("load_id")
      .notNull()
      .references(() => loads.id),
    weight: numeric("weight").notNull(),
    status: text("status", { enum: ["in_stock", "removed"] })
      .notNull()
      .default("in_stock"),
    qrToken: uuid("qr_token").notNull().unique().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Monotonically increasing insertion order. `createdAt` alone is not a
    // stable sort key: items inserted in the same batch INSERT can share the
    // same `now()` timestamp, so queries that need insertion order (e.g.
    // numbering an item within its load) order by this column instead.
    sequence: bigserial("sequence", { mode: "number" }).notNull().unique(),
  },
  (table) => [
    check("items_status_check", sql`${table.status} in ('in_stock', 'removed')`),
  ],
);

export const removals = pgTable("removals", {
  id: uuid("id").primaryKey().defaultRandom(),
  exitDate: timestamp("exit_date", { withTimezone: true }).notNull(),
  driver: text("driver").notNull(),
  vehiclePlate: text("vehicle_plate"),
  // Object path (not bytes) of the customer's Pedido reference image in the
  // `removal-pedidos` Supabase Storage bucket. Required — a removal always
  // has an attached Pedido image (business-rules.md#load-removal).
  pedidoImagePath: text("pedido_image_path").notNull(),
  totalRemovedWeight: numeric("total_removed_weight").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const removalItems = pgTable(
  "removal_items",
  {
    removalId: uuid("removal_id")
      .notNull()
      .references(() => removals.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
  },
  (table) => [primaryKey({ columns: [table.removalId, table.itemId] })],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableName: text("table_name").notNull(),
    recordId: uuid("record_id").notNull(),
    action: text("action", { enum: ["INSERT", "UPDATE", "DELETE"] }).notNull(),
    userId: uuid("user_id"),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "audit_log_action_check",
      sql`${table.action} in ('INSERT', 'UPDATE', 'DELETE')`,
    ),
  ],
);
