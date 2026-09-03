import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { Prisma, TestimonialRequest } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { getTestimonialRequestUrl } from "../utils/url";
import { notifyTestimonialRequest } from "./email.service";

export const createTestimonialRequest = async ( 
  userId: string,
  clientName: string,
  clientEmail?: string,
  title?: string,
  message?: string,
  questions?: string[]

): Promise<{
  request: TestimonialRequest;
  url: string;
}> => {
  const token = nanoid(16);

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  const request = await prisma.testimonialRequest.create({
    data: {
       user_id: userId,
      client_name: clientName,
      client_email: clientEmail,
      title,
      message,
      questions,
      token,
      expires_at: expiresAt,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
  throw new ApiError(404, "User not found");
}
  const url = getTestimonialRequestUrl(user.slug, token);

  // When a client email is provided the owner is asking us to send the
  // invite; otherwise they just copy the link themselves. Delivery issues
  // must not fail request creation, so this is fire-and-forget.
  if (clientEmail) {
    notifyTestimonialRequest(clientEmail, {
      clientName,
      ownerName: user.name,
      requestUrl: url,
      message,
      expiresAt,
    });
  }

  return { request,url, };
};

export const listTestimonialRequests = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { slug: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const requests = await prisma.testimonialRequest.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return requests.map((request) => ({
    ...request,
    url: getTestimonialRequestUrl(user.slug, request.token),
  }));
};

export const getTestimonialRequestByToken = async (token: string) => {
  const request = await prisma.testimonialRequest.findUnique({
    where: { token }, include: { user: { select: { avatar_url: true } } },
  });

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "This testimonial request has already been completed");
  }

  if (request.expires_at < new Date()) {
    // Lazily persist the expired status so the enum stays meaningful.
    await prisma.testimonialRequest.update({
      where: { id: request.id },
      data: { status: "expired" },
    });
    throw new ApiError(400, "This testimonial request has expired");
  }

  return request;
};

export const resendTestimonialRequest = async (userId: string, requestId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { slug: true, name: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const request = await prisma.testimonialRequest.findFirst({
    where: { id: requestId, user_id: userId },
  });
  if (!request) throw new ApiError(404, "Request not found");
  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be resent");
  }
  if (!request.client_email) {
    throw new ApiError(400, "This request has no email address to send to");
  }
  if (request.expires_at < new Date()) {
    throw new ApiError(400, "This request has expired");
  }

  const url = getTestimonialRequestUrl(user.slug, request.token);

  notifyTestimonialRequest(request.client_email, {
    clientName: request.client_name,
    ownerName: user.name,
    requestUrl: url,
    message: request.message,
    expiresAt: request.expires_at,
  });

  return { success: true };
};

export const markRequestCompleted = async (token: string) => {
  try {
    const request = await prisma.testimonialRequest.update({
      where: {
        token,
        status: "pending"
      },
      data: {
        status: "completed",
        completed_at: new Date(),
        upload_key: null,
        presigned_url_generated_at: null,
      }
    });

    return request;
    
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new ApiError(400, "Request already completed or not found");
    }
    throw err;
  }
};