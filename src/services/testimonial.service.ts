import {prisma} from "../config/prisma";
import {env} from "../config/env"
import { mediaQueue } from "../queues/media.queue";
import { markRequestCompleted } from "./testimonial-request.service";
import { logger } from "../config/logger";
import "dotenv/config";



export const confirmTestimonialUpload = async (
  token: string,
  key: string,
  duration?: number
) => {
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
    }
  });

  await mediaQueue.add("process", {
    testimonialId: testimonial.id,
  });

  logger.info(
    { testimonialId: testimonial.id },
    "MEDIA JOB QUEUED"
  );

  return testimonial;
};