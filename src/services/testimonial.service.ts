import { prisma } from "../config/prisma";
import { Prisma, TestimonialStatus } from '@prisma/client';
import { mediaQueue } from "../queues/media.queue";
import {
  markRequestCompleted,
  getTestimonialRequestByToken,
} from "./testimonial-request.service";
import { verifyS3ObjectExists } from "./s3.service";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import "dotenv/config";
import { Testimonial } from "@prisma/client";
import { getVideoUrl, getThumbnailUrl } from "../utils/media";

export interface GetTestimonialsOptions {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export const getTestimonials = async(options: GetTestimonialsOptions) =>     {
  const {
    userId,
    page = 1,
    limit = 12,
    status,
    isPublished,
    sortBy = "created_at",
    sortOrder = "desc",
    search,
  } = options;

  const skip = (page - 1) * limit;

  // where clause
  const where: Prisma.TestimonialWhereInput = {
    user_id: userId,
    deleted_at: null,
  };

  if(status){
    where.status = status as TestimonialStatus;
  }

  if (isPublished !== undefined) {
    where.is_published = isPublished;
  }
  
  if(search){
    where.OR = [
      {client_name : { contains: search, mode: "insensitive"} },
      {client_email : { contains: search, mode: "insensitive"} }
    ];
  }

  const allowedSortFields = ["created_at", "updated_at", "client_name", "duration_seconds", "confidence_score"];
if (!allowedSortFields.includes(sortBy)) {
  throw new ApiError(400, "Invalid sort field");
}

const allowedStatuses = ["pending", "media_processing", "transcribing", "ai_processing", "completed", "failed"];
if (status && !allowedStatuses.includes(status)) {
  throw new ApiError(400, "Invalid status");
}

  const orderBy: Prisma.TestimonialOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const total = await prisma.testimonial.count({ where });

    const testimonials = await prisma.testimonial.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    select: {
  id: true,
  client_name: true,
  client_email: true,

  video_key: true,
  thumbnail_key: true,

  status: true,
  duration_seconds: true,
  sentiment: true,
  industry: true,
  pain_points: true,
  outcomes: true,
  is_published: true,

  created_at: true,
  updated_at: true,

  request: {
    select: {
      token: true,
      expires_at: true,
      completed_at: true,
    },
  },
},
  });

const data = testimonials.map((testimonial) => {
  const {
    video_key,
    thumbnail_key,
    ...rest
  } = testimonial;

  return {
    ...rest,
    thumbnail_url: getThumbnailUrl(thumbnail_key),
  };
});

  return {
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrevious: page > 1,
  },
};
};

export const getTestimonialById = async (testimonialId: string, userId: string) =>{
  
  const testimonial = await prisma.testimonial.findFirst({
    where: {
      id: testimonialId,
      user_id: userId,
      deleted_at: null,

    },
    include : {
      request: {
        select: {
          token: true,
          expires_at: true,
          completed_at: true,
        }
      }

    }
  });
   if (!testimonial) {
    throw new ApiError(404, "Testimonial not found");
  }

const { video_key, thumbnail_key, ...rest } = testimonial;

return {
  ...rest,
  thumbnail_url: getThumbnailUrl(thumbnail_key),
  video_url: getVideoUrl(video_key),
};

}
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

  if (testimonial.deleted_at || testimonial.status !== "completed") {
    throw new ApiError(400, "Only completed testimonials can be published");
  }

  return prisma.testimonial.update({
    where: { id: testimonialId },
    data: { is_published: true, published_at: new Date() },
  });
};


