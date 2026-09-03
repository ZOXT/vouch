-- Reshape Subscription for Paddle (provider-agnostic columns)
ALTER TABLE "Subscription"
  DROP COLUMN "stripe_customer_id",
  DROP COLUMN "stripe_subscription_id",
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'paddle',
  ADD COLUMN "customer_id" TEXT,
  ADD COLUMN "subscription_id" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "current_period_end" TIMESTAMP(3),
  ALTER COLUMN "plan" SET DEFAULT 'free';

CREATE UNIQUE INDEX "Subscription_subscription_id_key" ON "Subscription"("subscription_id");
