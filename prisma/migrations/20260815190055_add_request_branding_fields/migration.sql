-- AlterTable
ALTER TABLE "TestimonialRequest" ADD COLUMN     "message" TEXT,
ADD COLUMN     "questions" JSONB,
ADD COLUMN     "title" TEXT;
