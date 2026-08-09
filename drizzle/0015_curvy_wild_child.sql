ALTER TABLE "loads" ADD COLUMN "nf_date" date;--> statement-breakpoint
-- Backfill `nf_date` for every existing row from `entry_date`'s calendar day
-- (issue #305). `entry_date` is `timestamptz`, so a bare `::date` would
-- truncate it in the *session's* timezone (UTC on Supabase — nothing here or
-- in lib/db/index.ts sets one). Entry Date is defined as a yard-local instant
-- (docs/specs/glossary.md), so a load entered at 22:00 America/Sao_Paulo would
-- back-fill to the *next* calendar day under UTC truncation. Shift to the
-- yard's zone explicitly, matching how lib/loads/entry-datetime.ts and
-- lib/db/removal-filters.ts derive a yard day.
-- One-time backfill for pre-existing rows only; new loads always supply
-- `nf_date` explicitly (lib/actions/loads.ts).
UPDATE "loads"
SET "nf_date" = ("entry_date" AT TIME ZONE 'America/Sao_Paulo')::date
WHERE "nf_date" IS NULL;
