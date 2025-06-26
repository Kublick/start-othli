CREATE TABLE "category_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"description" varchar(140),
	"is_income" boolean DEFAULT false NOT NULL,
	"exclude_from_budget" boolean DEFAULT false NOT NULL,
	"exclude_from_totals" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payees" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"conditions" text NOT NULL,
	"actions" text NOT NULL,
	"stop_processing" boolean DEFAULT false NOT NULL,
	"delete_after_use" boolean DEFAULT false NOT NULL,
	"run_on_updates" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_transaction" DROP CONSTRAINT "recurring_transaction_user_account_id_user_account_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_user_account_id_user_account_id_fk";
--> statement-breakpoint
ALTER TABLE "user_subscription" DROP CONSTRAINT "user_subscription_plan_id_subscription_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "type_name" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."account_type";--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('efectivo', 'debito', 'credito', 'inversion', 'cash');--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "type_name" SET DATA TYPE "public"."account_type" USING "type_name"::"public"."account_type";--> statement-breakpoint
ALTER TABLE "recurring_transaction" ALTER COLUMN "amount" SET DATA TYPE numeric(14, 4);--> statement-breakpoint
ALTER TABLE "recurring_transaction" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recurring_transaction" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "amount" SET DATA TYPE numeric(14, 4);--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "balance" SET DATA TYPE numeric(14, 4);--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "balance" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "month" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "total_amount" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD COLUMN "payee_id" integer;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD COLUMN "account_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "payee_id" integer;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "is_transfer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "transfer_account_id" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "type_name" "account_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "subtype_name" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "balance_as_of" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "closed_on" timestamp;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "institution_name" text;--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "exclude_transactions" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payees" ADD CONSTRAINT "payees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_account_id_user_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_payee_id_payees_id_fk" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_user_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_transfer_account_id_user_account_id_fk" FOREIGN KEY ("transfer_account_id") REFERENCES "public"."user_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "recurring_transaction" DROP COLUMN "user_account_id";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "user_account_id";--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN "type";