ALTER TABLE "store_chain" ADD COLUMN "is_national" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "store_location" ALTER COLUMN "suburb" DROP NOT NULL;
--> statement-breakpoint
CREATE TABLE "user_default_store_target" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chain_id" text NOT NULL,
	"store_location_id" text,
	CONSTRAINT "user_default_store_target_user_id_chain_id_unique" UNIQUE("user_id","chain_id")
);
--> statement-breakpoint
ALTER TABLE "user_default_store_target" ADD CONSTRAINT "user_default_store_target_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_default_store_target" ADD CONSTRAINT "user_default_store_target_chain_id_store_chain_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."store_chain"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_default_store_target" ADD CONSTRAINT "user_default_store_target_store_location_id_store_location_id_fk" FOREIGN KEY ("store_location_id") REFERENCES "public"."store_location"("id") ON DELETE set null ON UPDATE no action;
