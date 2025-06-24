CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"description" varchar(140),
	"is_income" boolean DEFAULT false NOT NULL,
	"exclude_from_budget" boolean DEFAULT false NOT NULL,
	"exclude_from_totals" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_on" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp,
	"is_group" boolean DEFAULT false NOT NULL,
	"group_id" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"group_category_name" varchar(100),
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;