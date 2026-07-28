import { Queue } from "bullmq";
import { env } from "../config/env";

export interface AIJobData {
  testimonialId: string;
}

export const aiQueue = new Queue<AIJobData>("ai", {
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
    removeOnFail: 500,
  },
});