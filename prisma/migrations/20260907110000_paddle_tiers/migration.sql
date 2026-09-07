-- AlterTable
-- Track the Paddle price/product that grants each plan plus any pending
-- schedule change (upgrade/downgrade/cancel) so the webhook mirror stays
-- in sync with the Paddle subscription lifecycle.
ALTER TABLE "Subscription" ADD COLUMN "price_id" TEXT,
ADD COLUMN "product_id" TEXT,
ADD COLUMN "scheduled_change_action" TEXT,
ADD COLUMN "scheduled_change_at" TIMESTAMP(3);