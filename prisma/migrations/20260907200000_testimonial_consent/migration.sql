ALTER TABLE "Testimonial" ADD COLUMN "consent_given" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN "consent_at" TIMESTAMP(3);
