import { prisma } from "../config/prisma";
import { mediaQueue } from "../queues/media.queue";
import { markRequestCompleted } from "./testimonial-request.service";
import { verifyS3ObjectExists } from "./s3.service";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import "dotenv/config";

export const confirmTestimonialUpload = async (
  token: string,
  key: string,
  duration?: number,
  mimeType?: string
) => {
  const exists = await verifyS3ObjectExists(key);
  if (!exists) {
    throw new ApiError(400, "Video upload could not be found. Please upload the video again.");
  }

  const request = await markRequestCompleted(token);
  const testimonial = await prisma.testimonial.create({
    data: {
      user_id: request.user_id,
      request_id: request.id,
      client_name: request.client_name,
      client_email: request.client_email,
      video_key: key,
      status: "pending",
      duration_seconds: duration,
      mime_type: mimeType,
    }
  });
  await mediaQueue.add("process", {
    testimonialId: testimonial.id,
  });
  logger.info({ testimonialId: testimonial.id }, "MEDIA JOB QUEUED");
  return testimonial;
};