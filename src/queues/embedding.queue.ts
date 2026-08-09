// src/queues/embedding.queue.ts
import { Queue } from "bullmq";
import { env } from "../config/env";

export const embeddingQueue = new Queue("embedding", {
  connection: { url: env.REDIS_URL },
});

export interface EmbeddingJobData {
  testimonialId: string;
}
