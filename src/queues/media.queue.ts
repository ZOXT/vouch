import { Queue } from "bullmq";
import { env } from "../config/env";

export interface MediaJobData {
  testimonialId: string;
}

export const mediaQueue = new Queue<MediaJobData>("media", {
  connection: {
    url: env.REDIS_URL,
  },
});