-- Add the required Pedido reference image path to removals. Added nullable
-- first and backfilled so this migration is safe against any existing rows
-- (e.g. the shared demo/production database) — the app has always required
-- driver/vehicle plate input, but pre-existing removal rows predate this
-- column and have no image to point to.
ALTER TABLE "removals" ADD COLUMN "pedido_image_path" text;
--> statement-breakpoint
UPDATE "removals" SET "pedido_image_path" = '' WHERE "pedido_image_path" IS NULL;
--> statement-breakpoint
ALTER TABLE "removals" ALTER COLUMN "pedido_image_path" SET NOT NULL;
