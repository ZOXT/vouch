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

  if (
    normalized.includes("prisma") ||
    normalized.includes("database") ||
    normalized.includes("execute raw") ||
    normalized.includes("22p02") ||
    normalized.includes("vector") ||
    normalized.includes("postgres")
  ) {
    return "database_error";
  }

  // Groq / AI API errors
  if (normalized.includes("timeout")) {
    return "groq_timeout";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("429")
  ) {
    return "groq_rate_limit";
  }

  // AI response formatting errors
  if (
    normalized.includes("invalid json") ||
    normalized.includes("unexpected token") ||
    normalized.includes("parse")
  ) {
    return "invalid_response";
  }

  if (
    normalized.includes("ffmpeg") ||
    normalized.includes("media")
  ) {
    return "media_processing";
  }

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
