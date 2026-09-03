-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN "captions_key" TEXT;

-- AlterTable
ALTER TABLE "EmbedSection" ADD COLUMN "captions_enabled" BOOLEAN NOT NULL DEFAULT true;
