ALTER TABLE "items" ADD COLUMN "sequence" bigserial NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_sequence_unique" UNIQUE("sequence");