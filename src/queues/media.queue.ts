import { Queue } from "bullmq";
import { env } from "../config/env";

export interface MediaJobData {
  testimonialId: string;
}

export const mediaQueue = new Queue<MediaJobData>("media", {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});