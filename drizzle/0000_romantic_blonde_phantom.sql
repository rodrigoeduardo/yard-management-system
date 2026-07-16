CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"load_id" uuid NOT NULL,
	"weight" numeric NOT NULL,
	"status" text DEFAULT 'in_stock' NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_qr_token_unique" UNIQUE("qr_token"),
	CONSTRAINT "items_status_check" CHECK ("items"."status" in ('in_stock', 'removed'))
);
--> statement-breakpoint
CREATE TABLE "loads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nota_fiscal" text NOT NULL,
	"entry_date" timestamp with time zone NOT NULL,
	"nf_weight" numeric NOT NULL,
	"material" text NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"remaining_weight" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "removal_items" (
	"removal_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	CONSTRAINT "removal_items_removal_id_item_id_pk" PRIMARY KEY("removal_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "removals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exit_date" timestamp with time zone NOT NULL,
	"driver" text NOT NULL,
	"total_removed_weight" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_load_id_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "removal_items" ADD CONSTRAINT "removal_items_removal_id_removals_id_fk" FOREIGN KEY ("removal_id") REFERENCES "public"."removals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "removal_items" ADD CONSTRAINT "removal_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;