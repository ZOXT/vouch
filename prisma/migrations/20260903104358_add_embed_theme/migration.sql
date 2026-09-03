-- DropIndex
DROP INDEX "Testimonial_campaign_id_idx";

-- AlterTable
ALTER TABLE "EmbedSection" ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'minimal';
