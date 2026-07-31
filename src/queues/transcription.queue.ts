import { Queue } from "bullmq";
import { env } from "../config/env";

export interface TranscriptionJobData {
  testimonialId: string;
  userId: string;
}

export const transcriptionQueue = new Queue("transcription",{
    connection :{
        url: env.REDIS_URL
    },
    defaultJobOptions:{
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000

        },
        removeOnComplete: 100,
        removeOnFail: 500
    }

});