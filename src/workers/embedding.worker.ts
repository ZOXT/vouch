import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { generateEmbedding } from "../services/embedding.service";
import { createFailedJob } from "../services/dlq.service";
import type { EmbeddingJobData } from "../queues/embedding.queue";

const processEmbeddingJob = async (job: Job) => {
  const { testimonialId } = job.data;

  logger.info({ jobId: job.id, testimonialId }, "EMBEDDING JOB RECEIVED");

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
      select: {
        id: true,
        transcript_redacted: true,
      },
    });

    if (!testimonial?.transcript_redacted) {
      throw new Error("No redacted transcript found for embedding");
    }

    await job.updateProgress(30);

    const embedding = await generateEmbedding(
      testimonial.transcript_redacted,
      "document"
    );

    // Safety check — make sure BGE returned 768 numbers
    if (embedding.length !== 768) {
      throw new Error(
        `Embedding dimension mismatch. Expected 768, got ${embedding.length}`
      );
    }

    await job.updateProgress(70);

    // Convert JS array [0.1, -0.2, ...] to pgvector string "[0.1,-0.2,...]"
    const vector = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "Testimonial"
      SET embedding = ${vector}::vector
      WHERE id = ${testimonialId}
    `;

    await job.updateProgress(100);

    logger.info(
      { testimonialId, dim: embedding.length },
      "Embedding stored in database"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ testimonialId, error: message }, "Embedding failed");
    throw error;
  }
};

export const embeddingWorker = new Worker(
  "embedding",
  processEmbeddingJob,
  {
    connection: { url: env.REDIS_URL },
    concurrency: 1,
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  }
);

embeddingWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Embedding job completed");
});

embeddingWorker.on("failed", async (job, error) => {
  const attemptsMade = job?.attemptsMade ?? 0;
  const maxAttempts = job?.opts.attempts ?? 1;

  logger.error(
    { jobId: job?.id, error: error.message, attemptsMade },
    "Embedding job failed"
  );

  if (job && attemptsMade >= maxAttempts) {
    await createFailedJob({
      queueName: "embedding",
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

const gracefulShutdown = async () => {
  logger.info("Shutting down embedding worker...");
  await embeddingWorker.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

logger.info("Embedding worker started (concurrency: 1)");
