-- Custom SQL migration file, put your code below! --
-- Persists the number printed on an item's physical label (#336). Every read
-- path used to re-derive it as the item's array position, but the queries
-- feeding those arrays sort by a tied key (see items.sequence's doc comment,
-- drizzle/0006) — so a load's item numbers could shift after a removal even
-- though the physical labels never change. This freezes the number as a
-- column, backfilled from `sequence` (the best available evidence of
-- original insertion order), and never recomputed again.
--
-- Split into ADD COLUMN / backfill / SET NOT NULL (rather than the plain
-- `ADD COLUMN ... NOT NULL` drizzle-kit would otherwise generate) because
-- existing rows need the backfill in between — a bare NOT NULL ADD COLUMN
-- has no default to satisfy it for rows that already exist.
ALTER TABLE "items" ADD COLUMN "number" integer;
--> statement-breakpoint
UPDATE "items" AS i
SET "number" = backfill.rn
FROM (
  SELECT id, row_number() OVER (PARTITION BY load_id ORDER BY sequence) AS rn
  FROM "items"
) AS backfill
WHERE i.id = backfill.id;
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "number" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "items_load_id_number_idx" ON "items" USING btree ("load_id","number");
--> statement-breakpoint
-- reset_demo_data() (drizzle/0008, 0011, 0013) inserts items directly and
-- must populate the new NOT NULL number column too, or the nightly demo
-- reset (ADR 0003) fails outright. `unnest(...) WITH ORDINALITY` gives each
-- unnested weight its 1-based position in the literal array, which is
-- exactly the intake form order these demo items are declared in — the same
-- rule `insertLoadWithItems` (lib/db/loads.ts) now applies to real intake.
CREATE OR REPLACE FUNCTION reset_demo_data() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  -- All six tables truncated together in one statement so no CASCADE is
  -- needed (every table referencing another is already in this list) and no
  -- FK-order juggling is required either.
  TRUNCATE TABLE removal_items, items, removals, loads, materials, audit_log
    RESTART IDENTITY;

  INSERT INTO materials (name) VALUES
    ('Sucata de Ferro'),
    ('Alumínio'),
    ('Cobre'),
    ('Papelão Ondulado'),
    ('Plástico PET'),
    ('Sucata de Aço Inox');

  -- Load 1/6 — NF 000123456, Sucata de Ferro, 16 items.
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123456', now() - interval '14 days', 29.60, m.id, 16, 29.60, 'OT-123456', 'Francisco das Chagas Silva'
    FROM materials m WHERE m.name = 'Sucata de Ferro'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[1.47,1.74,2.01,2.28,2.55,2.82,0.89,1.16,1.44,1.71,1.98,2.25,2.52,2.79,0.86,1.13]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Load 2/6 — NF 000123457, Alumínio, 17 items.
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123457', now() - interval '13 days', 32.69, m.id, 17, 32.69, 'OT-123457', 'Raimundo Nonato Alves'
    FROM materials m WHERE m.name = 'Alumínio'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[2.08,2.35,2.63,2.90,0.97,1.24,1.51,1.78,2.05,2.32,2.59,2.87,0.94,1.21,1.48,1.75,2.02]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Load 3/6 — NF 000123458, Cobre, 15 items.
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123458', now() - interval '12 days', 29.36, m.id, 15, 29.36, 'OT-123458', 'Sebastião Gomes Rocha'
    FROM materials m WHERE m.name = 'Cobre'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[2.70,2.97,1.04,1.31,1.58,1.86,2.13,2.40,2.67,2.94,1.01,1.28,1.55,1.82,2.10]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Load 4/6 — NF 000123459, Papelão Ondulado, 18 items.
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123459', now() - interval '11 days', 35.18, m.id, 18, 35.18, 'OT-123459', 'Vanderlei José Santos'
    FROM materials m WHERE m.name = 'Papelão Ondulado'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[1.12,1.39,1.66,1.93,2.20,2.47,2.74,3.02,1.09,1.36,1.63,1.90,2.17,2.44,2.71,2.98,1.05,1.32]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Load 5/6 — NF 000123460, Plástico PET, 15 items (fully removed below —
  -- ends the reset as the one finished load, item_count = 0).
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123460', now() - interval '10 days', 28.10, m.id, 15, 28.10, 'OT-123460', 'Wellington Braga Costa'
    FROM materials m WHERE m.name = 'Plástico PET'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[1.74,2.01,2.28,2.55,2.82,0.89,1.16,1.43,1.70,1.97,2.25,2.52,2.79,0.86,1.13]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Load 6/6 — NF 000123461, Sucata de Aço Inox, 16 items.
  WITH new_load AS (
    INSERT INTO loads (nota_fiscal, entry_date, nf_weight, material_id, item_count, remaining_weight, transport_order, driver)
    SELECT '000123461', now() - interval '9 days', 30.55, m.id, 16, 30.55, 'OT-123461', 'Antônio Carlos Pereira'
    FROM materials m WHERE m.name = 'Sucata de Aço Inox'
    RETURNING id
  )
  INSERT INTO items (load_id, weight, number)
  SELECT new_load.id, w, ord FROM new_load,
    unnest(ARRAY[2.35,2.62,2.89,0.96,1.24,1.51,1.78,2.05,2.32,2.59,2.86,0.93,1.20,1.48,1.75,2.02]::numeric[]) WITH ORDINALITY AS t(w, ord);

  -- Removal 1/3 — Carlos Eduardo Ferreira takes the 5 oldest in-stock items
  -- off the Cobre load (NF 000123458).
  WITH picked AS (
    SELECT id, load_id, weight FROM items
    WHERE load_id = (SELECT id FROM loads WHERE nota_fiscal = '000123458')
      AND status = 'in_stock'
    ORDER BY sequence ASC LIMIT 5
  ),
  new_removal AS (
    INSERT INTO removals (exit_date, driver, vehicle_plate, pedido_image_path, total_removed_weight)
    SELECT now() - interval '5 days', 'Carlos Eduardo Ferreira', 'BRA2E19', 'removal-pedidos/demo-seed-placeholder.jpg', COALESCE(SUM(weight), 0)
    FROM picked
    RETURNING id
  ),
  ins_removal_items AS (
    INSERT INTO removal_items (removal_id, item_id)
    SELECT nr.id, p.id FROM picked p CROSS JOIN new_removal nr
  ),
  upd_items AS (
    UPDATE items SET status = 'removed' WHERE id IN (SELECT id FROM picked)
  )
  UPDATE loads l SET
    item_count = l.item_count - g.cnt,
    remaining_weight = l.remaining_weight - g.wt
  FROM (SELECT load_id, count(*) AS cnt, SUM(weight) AS wt FROM picked GROUP BY load_id) g
  WHERE l.id = g.load_id;

  -- Removal 2/3 — Marcos Antônio Souza spans two loads in one removal (the
  -- multi-load removal invariant): 3 more items from Cobre (NF 000123458)
  -- and 4 items from Papelão Ondulado (NF 000123459).
  WITH picked AS (
    (
      SELECT id, load_id, weight FROM items
      WHERE load_id = (SELECT id FROM loads WHERE nota_fiscal = '000123458')
        AND status = 'in_stock'
      ORDER BY sequence ASC LIMIT 3
    )
    UNION ALL
    (
      SELECT id, load_id, weight FROM items
      WHERE load_id = (SELECT id FROM loads WHERE nota_fiscal = '000123459')
        AND status = 'in_stock'
      ORDER BY sequence ASC LIMIT 4
    )
  ),
  new_removal AS (
    INSERT INTO removals (exit_date, driver, vehicle_plate, pedido_image_path, total_removed_weight)
    SELECT now() - interval '3 days', 'Marcos Antônio Souza', 'PBB4A56', 'removal-pedidos/demo-seed-placeholder.jpg', COALESCE(SUM(weight), 0)
    FROM picked
    RETURNING id
  ),
  ins_removal_items AS (
    INSERT INTO removal_items (removal_id, item_id)
    SELECT nr.id, p.id FROM picked p CROSS JOIN new_removal nr
  ),
  upd_items AS (
    UPDATE items SET status = 'removed' WHERE id IN (SELECT id FROM picked)
  )
  UPDATE loads l SET
    item_count = l.item_count - g.cnt,
    remaining_weight = l.remaining_weight - g.wt
  FROM (SELECT load_id, count(*) AS cnt, SUM(weight) AS wt FROM picked GROUP BY load_id) g
  WHERE l.id = g.load_id;

  -- Removal 3/3 — José Ricardo Lima takes every remaining item off the
  -- Plástico PET load (NF 000123460), finishing it (item_count = 0,
  -- remaining_weight = 0 — renders green in Estoque).
  WITH picked AS (
    SELECT id, load_id, weight FROM items
    WHERE load_id = (SELECT id FROM loads WHERE nota_fiscal = '000123460')
      AND status = 'in_stock'
    ORDER BY sequence ASC LIMIT 15
  ),
  new_removal AS (
    INSERT INTO removals (exit_date, driver, vehicle_plate, pedido_image_path, total_removed_weight)
    SELECT now() - interval '1 days', 'José Ricardo Lima', 'RIO3F45', 'removal-pedidos/demo-seed-placeholder.jpg', COALESCE(SUM(weight), 0)
    FROM picked
    RETURNING id
  ),
  ins_removal_items AS (
    INSERT INTO removal_items (removal_id, item_id)
    SELECT nr.id, p.id FROM picked p CROSS JOIN new_removal nr
  ),
  upd_items AS (
    UPDATE items SET status = 'removed' WHERE id IN (SELECT id FROM picked)
  )
  UPDATE loads l SET
    item_count = l.item_count - g.cnt,
    remaining_weight = l.remaining_weight - g.wt
  FROM (SELECT load_id, count(*) AS cnt, SUM(weight) AS wt FROM picked GROUP BY load_id) g
  WHERE l.id = g.load_id;
END;
$$;
