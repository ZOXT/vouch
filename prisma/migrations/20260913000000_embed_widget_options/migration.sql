-- AlterTable
ALTER TABLE "EmbedSection" ADD COLUMN     "show_summary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EmbedSection" ADD COLUMN     "max_width" INTEGER;
ALTER TABLE "EmbedSection" ADD COLUMN     "title_align" TEXT NOT NULL DEFAULT 'left';