// src/workers/ai.worker.ts

import "dotenv/config";
import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import {
  detectPII,
  maskPII,
  calculateRiskScore,
} from "../services/pii.service";
import { analyzeTranscript } from "../services/ai.service";
import type { AIJobData } from "../queues/ai.queue";

const processAIJob = async (job: Job<AIJobData>) => {
  const { testimonialId } = job.data;

  logger.info({ testimonialId }, "Starting AI processing");

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

    await prisma.testimonial.update({
      where: {
        id: testimonialId,
      },
      data: {
        status: "ai_processing",
      },
    });

    await job.updateProgress(10);

    const piiResult = detectPII(testimonial.transcript);

    await job.updateProgress(25);

    const sanitizedTranscript = maskPII(
      testimonial.transcript
    );

    await job.updateProgress(40);

    const privacyRisk = calculateRiskScore(
      piiResult.detected
    );

    await job.updateProgress(55);

    const analysis = await analyzeTranscript(
      sanitizedTranscript
    );

    await job.updateProgress(80);

    await prisma.testimonial.update({
      where: {
        id: testimonialId,
      },
      data: {
        masked_transcript: sanitizedTranscript,
        pii_detected: piiResult.hasPII,
        pii_risk_score: privacyRisk.score,
        summary: analysis.summary,
        industry: analysis.industry,
        sentiment: analysis.sentiment,
        keywords: analysis.keywords,
        pain_points: analysis.painPoints,
        customer_type: analysis.customerType,
        language: analysis.language,
        confidence_score: analysis.confidence,
        status: "completed",
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

aiWorker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      error: error.message,
    },
    "AI job failed"
  );
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