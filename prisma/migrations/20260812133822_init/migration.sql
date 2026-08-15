-- CreateExtensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('freelancer', 'agency');

-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('pending', 'media_processing', 'transcribing', 'ai_processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('positive', 'neutral', 'negative', 'mixed');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "FailedJobStatus" AS ENUM ('pending', 'retrying', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "FailureCategory" AS ENUM ('groq_timeout', 'groq_rate_limit', 'invalid_response', 'database_error', 'media_processing', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "company_name" TEXT,
    "avatar_url" TEXT,
    "slug" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestimonialRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT,
    "token" TEXT NOT NULL,
    "upload_key" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "presigned_url_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestimonialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_id" TEXT,
    "client_name" TEXT NOT NULL,
    "client_email" TEXT,
    "video_key" TEXT,
    "audio_key" TEXT,
    "thumbnail_key" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" BIGINT,
    "duration_seconds" INTEGER,
    "transcript" TEXT,
    "transcript_redacted" TEXT,
    "industry" TEXT,
    "sentiment" "Sentiment",
    "pain_points" TEXT[],
    "outcomes" TEXT[],
    "objections" TEXT[],
    "metadata" JSONB,
    "pii_detected" BOOLEAN NOT NULL DEFAULT false,
    "pii_risk_score" DOUBLE PRECISION,
    "risk_level" "RiskLevel",
    "risk_score" DOUBLE PRECISION,
    "failure_reason" TEXT,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "embedding" vector,
    "confidence_score" DOUBLE PRECISION,
    "customer_type" TEXT,
    "keywords" TEXT[],
    "language" TEXT,
    "summary" TEXT,
    "processing_completed_at" TIMESTAMP(3),
    "processing_started_at" TIMESTAMP(3),
    "total_processing_ms" INTEGER,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL,
    "testimonial_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,
    "operation" TEXT NOT NULL DEFAULT 'analysis',
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedJob" (
    "id" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "job_id" TEXT,
    "testimonial_id" TEXT,
    "error_message" TEXT NOT NULL,
    "error_stack" TEXT,
    "category" "FailureCategory" NOT NULL DEFAULT 'unknown',
    "attempts" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "FailedJobStatus" NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "job_name" TEXT,

    CONSTRAINT "FailedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TestimonialRequest_token_key" ON "TestimonialRequest"("token");

-- CreateIndex
CREATE INDEX "TestimonialRequest_token_idx" ON "TestimonialRequest"("token");

-- CreateIndex
CREATE INDEX "TestimonialRequest_user_id_idx" ON "TestimonialRequest"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_request_id_key" ON "Testimonial"("request_id");

-- CreateIndex
CREATE INDEX "Testimonial_user_id_idx" ON "Testimonial"("user_id");

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");

-- CreateIndex
CREATE INDEX "Testimonial_industry_idx" ON "Testimonial"("industry");

-- CreateIndex
CREATE INDEX "Testimonial_user_id_status_idx" ON "Testimonial"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_user_id_key" ON "Subscription"("user_id");

-- CreateIndex
CREATE INDEX "AIUsage_testimonial_id_idx" ON "AIUsage"("testimonial_id");

-- CreateIndex
CREATE INDEX "AIUsage_provider_idx" ON "AIUsage"("provider");

-- CreateIndex
CREATE INDEX "AIUsage_model_idx" ON "AIUsage"("model");

-- CreateIndex
CREATE INDEX "AIUsage_operation_idx" ON "AIUsage"("operation");

-- CreateIndex
CREATE INDEX "FailedJob_status_idx" ON "FailedJob"("status");

-- CreateIndex
CREATE INDEX "FailedJob_queue_name_idx" ON "FailedJob"("queue_name");

-- CreateIndex
CREATE INDEX "FailedJob_testimonial_id_idx" ON "FailedJob"("testimonial_id");

-- AddForeignKey
ALTER TABLE "TestimonialRequest" ADD CONSTRAINT "TestimonialRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "TestimonialRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_testimonial_id_fkey" FOREIGN KEY ("testimonial_id") REFERENCES "Testimonial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
