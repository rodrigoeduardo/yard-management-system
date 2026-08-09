ALTER TABLE "removals" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "removals" ADD COLUMN "cancelled_by" uuid;