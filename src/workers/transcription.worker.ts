import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import type { TranscriptionJobData } from "../queues/transcription.queue";

const processTranscript = async (job: Job<TranscriptionJobData>) => {
  const { testimonialId, videoUrl } = job.data;

  logger.info(`Processing transcription for testimonial ${testimonialId}`);

  try {
    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { status: "processing" }
    });

    // TODO: Call Groq Whisper here next
    // Simulating for now...
    await new Promise(resolve => setTimeout(resolve, 2000));


    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        status: "completed",
        transcript: "Placeholder transcript, Groq Whisper coming next"
      }
    });

    logger.info(`Transcription completed for ${testimonialId}`);
    
  } catch (error) {

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { status: "failed" }
    });
    throw error; // Rethrow so BullMQ knows job failed and retries
  }
};

export const transcriptionWorker = new Worker(
  "transcription",
  processTranscript,
  {
    connection: {
      url: env.REDIS_URL
    },
    concurrency: 5,
  }
);

transcriptionWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed`);
});

transcriptionWorker.on("failed", (job, error) => {
  logger.error({ err: error, jobId: job?.id }, "Job failed");
});