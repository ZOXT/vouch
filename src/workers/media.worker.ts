import "dotenv/config";
import { Worker, Job } from "bullmq";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { transcriptionQueue } from "../queues/transcription.queue";
import path from "path";
import {
  createTempDirectory,
  cleanupTempDirectory,
  validateMedia,
  generateThumbnail,
  extractAudio,
  MediaValidationError,
  MediaProcessingError,
} from "../services/ffmpeg.service";
import { downloadFromS3, uploadFile } from "../services/s3.service";

interface MediaJobData {
  testimonialId: string;
}

const processMediaJob = async (job: Job<MediaJobData>) => {
  const { testimonialId } = job.data;
  let tempDir: string | null = null;

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!testimonial || !testimonial.video_key) {
      throw new Error("Testimonial not found or missing video_key");
    }

    if (testimonial.audio_key && testimonial.thumbnail_key) {
      logger.info({ testimonialId }, "Media already processed, skipping...");
      await transcriptionQueue.add(
        "transcribe",
        {
          testimonialId,
          userId: testimonial.user_id,
        },
        {
          jobId: `transcribe-${testimonialId}`,
          attempts: 3,
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
      return;
    }

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { status: "media_processing" },
    });

    await job.updateProgress(10);

    tempDir = await createTempDirectory(testimonialId);

    const videoPath = path.join(tempDir, "video.mp4");
    await downloadFromS3(testimonial.video_key, videoPath);

    await job.updateProgress(25);

    const mediaInfo = await validateMedia(videoPath);

    await job.updateProgress(40);

    const thumbnailPath = await generateThumbnail(videoPath, tempDir, mediaInfo.duration);
    const thumbnailKey = `thumbnails/${testimonialId}/thumbnail.jpg`;
    await uploadFile(thumbnailPath, thumbnailKey, "image/jpeg");

    await job.updateProgress(60);

    const audioPath = await extractAudio(videoPath, tempDir);
    const audioKey = `audio/${testimonialId}/audio.wav`;
    await uploadFile(audioPath, audioKey, "audio/wav");

    await job.updateProgress(80);

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        audio_key: audioKey,
        thumbnail_key: thumbnailKey,
        duration_seconds: mediaInfo.duration,
        file_size_bytes: BigInt(mediaInfo.fileSizeBytes),
        metadata: {
          codec: mediaInfo.codec,
          width: mediaInfo.width,
          height: mediaInfo.height,
        },
      },
    });

    await transcriptionQueue.add(
      "transcribe",
      {
        testimonialId,
        userId: testimonial.user_id,
      },
      {
        jobId: `transcribe-${testimonialId}`,
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    await job.updateProgress(100);

    logger.info(
      {
        testimonialId,
        thumbnailKey,
        audioKey,
        duration: mediaInfo.duration,
        codec: mediaInfo.codec,
        resolution: `${mediaInfo.width}x${mediaInfo.height}`,
      },
      "Media processing completed"
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    if (err instanceof MediaValidationError) {
      await prisma.testimonial.update({
        where: { id: testimonialId },
        data: {
          status: "failed",
          failure_reason: errorMessage,
        },
      });
      return;
    }

    if (err instanceof MediaProcessingError) {
      await prisma.testimonial.update({
        where: { id: testimonialId },
        data: {
          failure_reason: errorMessage,
        },
      });
      logger.warn(
        { testimonialId, error: errorMessage },
        "Media processing error (retryable)"
      );
      throw err;
    }

    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: {
        failure_reason: errorMessage,
      },
    });

    logger.error({ testimonialId, err }, "Media processing failed");
    throw err;
  } finally {
    if (tempDir) {
      await cleanupTempDirectory(tempDir);
    }
  }
};

export const mediaWorker = new Worker<MediaJobData>(
  "media",  
  processMediaJob,
  {
    connection: { url: env.REDIS_URL },
    concurrency: 3,
  }
);

mediaWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Media job completed");
});

mediaWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "Media job failed");
});

const gracefulShutdown = async () => {
  logger.info("Shutting down media worker...");
  await mediaWorker.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

logger.info("Media worker started, waiting for jobs...");