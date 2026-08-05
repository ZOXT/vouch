import { prisma } from "../config/prisma";
import { logger } from "../config/logger";

type FailureCategory =
  | "groq_timeout"
  | "groq_rate_limit"
  | "invalid_response"
  | "database_error"
  | "media_processing"
  | "unknown";

const categorizeError = (message: string): FailureCategory => {
  const normalized = message.toLowerCase();

  if (normalized.includes("timeout")) return "groq_timeout";
  if (normalized.includes("rate limit") || normalized.includes("429")) return "groq_rate_limit";
  if (normalized.includes("invalid") || normalized.includes("json")) return "invalid_response";
  if (normalized.includes("database") || normalized.includes("prisma")) return "database_error";
  if (normalized.includes("ffmpeg") || normalized.includes("media")) return "media_processing";
  return "unknown";
};

export const createFailedJob = async ({
  queueName,
  jobId,
  jobName,
  testimonialId,
  error,
  stack,
  attempts,
  payload,
}: {
  queueName: string;
  jobId?: string;
  jobName?: string;
  testimonialId?: string;
  error: string;
  stack?: string;
  attempts: number;
  payload: unknown;
}) => {
  try {
    const category = categorizeError(error);

    await prisma.failedJob.create({
      data: {
        queue_name: queueName,
        job_id: jobId,
        job_name: jobName,
        testimonial_id: testimonialId,
        error_message: error,
        error_stack: stack,
        category,
        attempts,
        payload: payload as object,
      },
    });

    logger.warn(
      {
        queueName,
        testimonialId,
        category,
        attempts,
      },
      "Job recorded in DLQ"
    );
  } catch (dbError) {
    logger.error({ dbError }, "Failed to write to DLQ");
  }
};
