CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loads" ADD COLUMN "material_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "materials_name_lower_idx" ON "materials" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "loads" ADD CONSTRAINT "loads_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Custom SQL below: backfill one materials row per distinct existing
-- loads.material value (case-insensitive — DISTINCT ON (lower(material))
-- keeps a single representative casing per group, matching the
-- case-insensitive unique index above), point every load at its backfilled
-- material, then require and enforce the new FK and drop the old column.
-- No-op on an empty loads table (0 distinct values to insert/backfill).
INSERT INTO "materials" ("name")
SELECT DISTINCT ON (lower("material")) "material"
FROM "loads"
ORDER BY lower("material"), "material";
--> statement-breakpoint
UPDATE "loads"
SET "material_id" = "materials"."id"
FROM "materials"
WHERE lower("materials"."name") = lower("loads"."material");
--> statement-breakpoint
ALTER TABLE "loads" ALTER COLUMN "material_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "loads" DROP COLUMN "material";
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "authenticated_full_access" ON "materials"
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE TRIGGER materials_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON "materials"
  FOR EACH ROW EXECUTE FUNCTION audit_log_row();