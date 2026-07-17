import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const loads = pgTable("loads", {
  id: uuid("id").primaryKey().defaultRandom(),
  notaFiscal: text("nota_fiscal").notNull(),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull(),
  nfWeight: numeric("nf_weight").notNull(),
  material: text("material").notNull(),
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
  },
  (table) => [
    check("items_status_check", sql`${table.status} in ('in_stock', 'removed')`),
  ],
);

export const removals = pgTable("removals", {
  id: uuid("id").primaryKey().defaultRandom(),
  exitDate: timestamp("exit_date", { withTimezone: true }).notNull(),
  driver: text("driver").notNull(),
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
