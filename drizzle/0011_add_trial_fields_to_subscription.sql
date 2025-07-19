-- Add trial_start and trial_end fields to subscription table
ALTER TABLE "subscription" ADD COLUMN "trial_start" timestamp;
ALTER TABLE "subscription" ADD COLUMN "trial_end" timestamp;

-- Add unique constraints on reference_id and stripe_subscription_id
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_reference_id_unique" UNIQUE ("reference_id");
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_stripe_subscription_id_unique" UNIQUE ("stripe_subscription_id");

-- Add index on reference_id for faster lookups
CREATE INDEX "subscription_reference_id_idx" ON "subscription" ("reference_id");