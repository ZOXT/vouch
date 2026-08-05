import "dotenv/config";
import { prisma } from "../config/prisma";
import { mediaQueue, type MediaJobData } from "../queues/media.queue";
import { transcriptionQueue, type TranscriptionJobData } from "../queues/transcription.queue";
import { aiQueue, type AIJobData } from "../queues/ai.queue";

const queueMap = {
  media: mediaQueue,
  transcription: transcriptionQueue,
  ai: aiQueue,
};

type DLQJobPayload = MediaJobData | TranscriptionJobData | AIJobData;

const retryFailed = async () => {
  const failedJobs = await prisma.failedJob.findMany({
    where: { status: "pending" },
  });

  console.log(`Found ${failedJobs.length} failed jobs`);

  for (const job of failedJobs) {
    const queueName = job.queue_name as "media" | "transcription" | "ai";
    const queue = queueMap[queueName];
    if (!queue) {
      console.warn(`No queue configured for ${job.queue_name}. Skipping ${job.id}.`);
      continue;
    }

    const payload = job.payload as unknown;

    if (job.queue_name === "media") {
      await mediaQueue.add(`retry-${job.id}`, payload as MediaJobData);
    } else if (job.queue_name === "transcription") {
      await transcriptionQueue.add(`retry-${job.id}`, payload as TranscriptionJobData);
    } else if (job.queue_name === "ai") {
      await aiQueue.add(`retry-${job.id}`, payload as AIJobData);
    } else {
      console.warn(`Unsupported queue ${job.queue_name} for failed job ${job.id}`);
      continue;
    }

    await prisma.failedJob.update({
      where: { id: job.id },
      data: { status: "retrying" },
    });

    console.log(`Requeued: ${job.id} (${job.queue_name})`);
  }

  process.exit(0);
};

retryFailed().catch((error) => {
  console.error("DLQ retry failed", error);
  process.exit(1);
});
