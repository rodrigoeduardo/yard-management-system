ALTER TABLE "loads" ADD COLUMN "nf_date" date;--> statement-breakpoint
-- Backfill `nf_date` for every existing row from `entry_date`'s calendar day
-- (issue #305). `entry_date` is `timestamptz` — casting to `date` truncates
-- it in the session's timezone, which is fine here: this is a one-time
-- backfill for pre-existing rows only, not a general date-derivation rule.
-- New loads always supply `nf_date` explicitly (lib/actions/loads.ts).
UPDATE "loads" SET "nf_date" = "entry_date"::date WHERE "nf_date" IS NULL;
