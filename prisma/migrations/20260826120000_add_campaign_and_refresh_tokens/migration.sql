-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN "campaign_id" TEXT;

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allow_video" BOOLEAN NOT NULL DEFAULT true,
    "allow_text" BOOLEAN NOT NULL DEFAULT false,
    "max_duration" INTEGER NOT NULL DEFAULT 120,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "submission_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
CREATE INDEX "Campaign_user_id_idx" ON "Campaign"("user_id");
CREATE INDEX "Campaign_slug_idx" ON "Campaign"("slug");
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");
CREATE INDEX "Testimonial_campaign_id_idx" ON "Testimonial"("campaign_id");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
