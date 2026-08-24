-- CreateTable
CREATE TABLE "EmbedSection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "public_id" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allowed_domains" TEXT[],
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbedSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedSectionTestimonial" (
    "embed_section_id" TEXT NOT NULL,
    "testimonial_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmbedSectionTestimonial_pkey" PRIMARY KEY ("embed_section_id","testimonial_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbedSection_public_id_key" ON "EmbedSection"("public_id");

-- CreateIndex
CREATE INDEX "EmbedSection_user_id_idx" ON "EmbedSection"("user_id");

-- CreateIndex
CREATE INDEX "EmbedSection_public_id_idx" ON "EmbedSection"("public_id");

-- CreateIndex
CREATE INDEX "EmbedSectionTestimonial_testimonial_id_idx" ON "EmbedSectionTestimonial"("testimonial_id");

-- AddForeignKey
ALTER TABLE "EmbedSection" ADD CONSTRAINT "EmbedSection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedSectionTestimonial" ADD CONSTRAINT "EmbedSectionTestimonial_embed_section_id_fkey" FOREIGN KEY ("embed_section_id") REFERENCES "EmbedSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedSectionTestimonial" ADD CONSTRAINT "EmbedSectionTestimonial_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
