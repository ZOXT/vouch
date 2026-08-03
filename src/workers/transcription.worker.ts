import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { aiQueue } from "../queues/ai.queue";
import type { TranscriptionJobData } from "../queues/transcription.queue";
import { transcribeAudio } from "../services/transcription.service";

const processTranscript = async (job: Job<TranscriptionJobData>) => {
  const { testimonialId } = job.data;

  logger.info(
    {
      jobId: job.id,
      data: job.data,
    },
    "TRANSCRIPTION JOB RECEIVED"
  );

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!testimonial?.audio_key) {
      throw new Error("Audio not found for testimonial");
    }

    if (testimonial.transcript) {
      logger.info(
        { testimonialId },
        "Transcript already exists, skipping transcription"
      );

      await aiQueue.add(
        "analyze",
        { testimonialId },
        {
          jobId: `ai-${testimonialId}`,
          attempts: 3,
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );

      return;
    }

    const processingStartedAt = testimonial.processing_started_at ?? new Date();

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        status: "transcribing",
        processing_started_at: processingStartedAt,
      },
    });

    await job.updateProgress(10);

    const transcription = await transcribeAudio(testimonial.audio_key);

    await job.updateProgress(90);

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        transcript: transcription.transcript,
        status: "ai_processing",
      },
    });

    await prisma.aIUsage.create({
      data: {
        testimonial_id: testimonialId,
        provider: "groq",
        model: env.GROQ_WHISPER_MODEL,
        operation: "transcription",
        prompt_tokens: transcription.usage.promptTokens,
        completion_tokens: transcription.usage.completionTokens,
        total_tokens: transcription.usage.totalTokens,
        latency_ms: transcription.usage.latencyMs,
        success: true,
      },
    });

    await aiQueue.add(
      "analyze",
      {
        testimonialId,
      },
      {
        jobId: `ai-${testimonialId}`,
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    logger.info(
      { testimonialId },
      "AI JOB QUEUED"
    );

    await job.updateProgress(100);

    const wordCount = transcription.transcript.split(/\s+/).length;

    logger.info(
      {
        testimonialId,
        characters: transcription.transcript.length,
        words: wordCount,
      },
      "Transcription completed, AI analysis queued"
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error(
      { testimonialId, error: errorMessage },
      "Transcription failed"
    );

    try {
      await prisma.aIUsage.create({
        data: {
          testimonial_id: testimonialId,
          provider: "groq",
          model: env.GROQ_WHISPER_MODEL,
          operation: "transcription",
          success: false,
          error_message: errorMessage,
        },
      });
    } catch (dbError) {
      logger.error(
        { testimonialId, dbError },
        "Failed to record transcription usage"
      );
    }

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        status: "failed",
        failure_reason: errorMessage,
      },
    });

    throw error;
  }
};

export const transcriptionWorker = new Worker<TranscriptionJobData>(
  "transcription",
  processTranscript,
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

transcriptionWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, "Job completed");
});

transcriptionWorker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    },
    "Job failed"
  );
});

transcriptionWorker.on("error", (error) => {
  logger.error({ error: error.message }, "Worker error");
});

const gracefulShutdown = async () => {
  logger.info("Shutting down transcription worker...");
  await transcriptionWorker.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

logger.info("Transcription worker started, waiting for jobs...");