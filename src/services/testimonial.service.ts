import { prisma } from "../config/prisma";
import { mediaQueue } from "../queues/media.queue";
import {
  markRequestCompleted,
  getTestimonialRequestByToken,
} from "./testimonial-request.service";
import { verifyS3ObjectExists } from "./s3.service";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import "dotenv/config";

export const softDeleteTestimonial = async (
  testimonialId: string,
  userId: string,
) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  if (testimonial.user_id !== userId) {
    throw new ApiError(403, "You don't have access to this testimonial");
  }

  if (testimonial.deleted_at) {
    throw new ApiError(404, "Testimonial not found");
  }

  await prisma.testimonial.update({
    where: { id: testimonialId },
    data: { deleted_at: new Date() },
  });
};

export const confirmTestimonialUpload = async (
  token: string,
  key: string,
  duration?: number,
  mimeType?: string,
) => {
  const request = await getTestimonialRequestByToken(token);

  if (!request.upload_key) {
    throw new ApiError(
      400,
      "No upload has been initialized for this testimonial request.",
    );
  }

  if (request.upload_key !== key) {
    throw new ApiError(
      403,
      "The uploaded file does not belong to this testimonial request.",
    );
  }
  const exists = await verifyS3ObjectExists(key);

  if (!exists) {
    throw new ApiError(
      400,
      "Video upload could not be found. Please upload the video again.",
    );
  }

  const completedRequest = await markRequestCompleted(token);

  const testimonial = await prisma.testimonial.create({
    data: {
      user_id: completedRequest.user_id,
      request_id: completedRequest.id,
      client_name: completedRequest.client_name,
      client_email: completedRequest.client_email,
      video_key: key,
      status: "pending",
      duration_seconds: duration,
      mime_type: mimeType,
    },
  });
  await mediaQueue.add("process", {
    testimonialId: testimonial.id,
  });

  logger.info(
    {
      testimonialId: testimonial.id,
    },
    "MEDIA JOB QUEUED",
  );

  return {
    id: testimonial.id,
    status: testimonial.status,
    message: "Testimonial uploaded successfully and processing has started",
  };
};

export const publishTestimonial = async (
  testimonialId: string,
  userId: string,
) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id: testimonialId },
  });

  if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

  if (testimonial.user_id !== userId) {
    throw new ApiError(403, "You don't have access to this testimonial");
  }

  return prisma.testimonial.update({
    where: { id: testimonialId },
    data: { is_published: true, published_at: new Date() },
  });
};
