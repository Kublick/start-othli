ALTER TABLE "budget" ALTER COLUMN "currency" SET DEFAULT 'MXN';--> statement-breakpoint
ALTER TABLE "recurring_transaction" ALTER COLUMN "currency" SET DEFAULT 'MXN';--> statement-breakpoint
ALTER TABLE "subscription_plan" ALTER COLUMN "currency" SET DEFAULT 'MXN';--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "currency" SET DEFAULT 'MXN';--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "currency" SET DEFAULT 'MXN';