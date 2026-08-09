import "dotenv/config";
import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { createFailedJob } from "../services/dlq.service";
import { embeddingQueue } from "../queues/embedding.queue";
import {
  detectPII,
  maskPII,
  calculateRiskScore,
} from "../services/pii.service";
import { analyzeTranscript } from "../services/ai.service";
import type { AIJobData } from "../queues/ai.queue";

const processAIJob = async (job: Job<AIJobData>) => {
  const { testimonialId } = job.data;

  logger.info(
    {
      jobId: job.id,
      data: job.data,
    },
    "AI JOB RECEIVED"
  );

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: {
        id: testimonialId,
      },
    });

    if (!testimonial || !testimonial.transcript) {
      throw new Error("Transcript not found");
    }

    if (testimonial.status === "completed") {
      logger.info(
        { testimonialId },
        "AI processing already completed"
      );
      return;
    }

    const processingStartedAt = testimonial.processing_started_at ?? new Date();

    await prisma.testimonial.update({
      where: {
        id: testimonialId,
      },
      data: {
        status: "ai_processing",
        processing_started_at: processingStartedAt,
      },
    });

    await job.updateProgress(10);

    const piiResult = detectPII(testimonial.transcript);

    await job.updateProgress(25);

    const sanitizedTranscript = maskPII(testimonial.transcript);

    await job.updateProgress(40);

    const privacyRisk = calculateRiskScore(piiResult.detected);

    await job.updateProgress(55);

    const analysis = await analyzeTranscript(sanitizedTranscript);

    await job.updateProgress(80);

    // Queue embedding job — separate from AI analysis
    await embeddingQueue.add(
      "embed",
      { testimonialId },
      {
        jobId: `embedding-${testimonialId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    logger.info({ testimonialId }, "Embedding job queued");

    await job.updateProgress(90);

    const completedAt = new Date();
    const totalProcessingMs = processingStartedAt.getTime()
      ? completedAt.getTime() - processingStartedAt.getTime()
      : null;

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        transcript_redacted: sanitizedTranscript,
        pii_detected: piiResult.hasPII,
        pii_risk_score: privacyRisk.score,
        risk_level: privacyRisk.level,
        industry: analysis.industry,
        sentiment: analysis.sentiment,
        summary: analysis.summary,
        keywords: analysis.keywords,
        customer_type: analysis.customerType,
        language: analysis.language,
        confidence_score: analysis.confidence,
        pain_points: analysis.painPoints,
        outcomes: analysis.outcomes,
        objections: analysis.objections,
        metadata: {
          piiTypes: piiResult.detected,
          riskLevel: privacyRisk.level,
          analysisModel: env.AI_MODEL ?? env.GROQ_MODEL,
          transcriptionModel: env.GROQ_WHISPER_MODEL,
        },
        status: "completed",
        processed_at: completedAt,
        processing_completed_at: completedAt,
        total_processing_ms: totalProcessingMs,
      },
    });

    await prisma.aIUsage.create({
      data: {
        testimonial_id: testimonialId,
        provider: "groq",
        model: env.AI_MODEL ?? env.GROQ_MODEL,
        operation: "analysis",
        prompt_tokens: analysis.usage.promptTokens,
        completion_tokens: analysis.usage.completionTokens,
        total_tokens: analysis.usage.totalTokens,
        latency_ms: analysis.usage.latencyMs,
        success: true,
      },
    });

    await job.updateProgress(100);

    logger.info(
      {
        testimonialId,
        industry: analysis.industry,
        sentiment: analysis.sentiment,
        piiRisk: privacyRisk.level,
      },
      "AI processing completed"
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    logger.error(
      {
        testimonialId,
        error: message,
      },
      "AI processing failed"
    );

    try {
      await prisma.testimonial.update({
        where: { id: testimonialId },
        data: {
          status: "failed",
          failure_reason: `AI processing failed: ${message}`,
        },
      });

      await prisma.aIUsage.create({
        data: {
          testimonial_id: testimonialId,
          provider: "groq",
          model: env.AI_MODEL ?? env.GROQ_MODEL,
          operation: "analysis",
          success: false,
          error_message: message,
        },
      });
    } catch (dbError) {
      logger.error(
        { testimonialId, dbError },
        "Failed to update failure status"
      );
    }

    throw error;
  }
};

export const aiWorker = new Worker<AIJobData>(
  "ai",
  processAIJob,
  {
    connection: {
      url: env.REDIS_URL,
    },
    concurrency: 5,
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600,
    },
  }
);

aiWorker.on("completed", (job) => {
  logger.info(
    {
      jobId: job.id,
    },
    "AI job completed"
  );
});

aiWorker.on("failed", async (job, error) => {
  const maxAttempts = job?.opts.attempts ?? 1;
  const attemptsMade = job?.attemptsMade ?? 0;

  logger.error(
    {
      jobId: job?.id,
      error: error.message,
      attemptsMade,
      willRetry: attemptsMade < maxAttempts,
    },
    "AI job failed"
  );

  if (job && attemptsMade >= maxAttempts) {
    await createFailedJob({
      queueName: "ai",
      jobId: job.id,
      jobName: job.name,
      testimonialId: job.data.testimonialId,
      error: error.message,
      stack: error.stack,
      attempts: attemptsMade,
      payload: job.data,
    });
  }
});

aiWorker.on("error", (error) => {
  logger.error(
    { error: error.message },
    "AI worker error"
  );
});

const gracefulShutdown = async () => {
  logger.info("Shutting down AI worker...");
  await aiWorker.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

logger.info("AI worker started");
