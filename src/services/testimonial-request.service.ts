import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { Prisma, TestimonialRequest } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

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
  const url = `${process.env.APP_URL}/${user.slug}/r/${token}`;

  return { request,url, };
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
    throw new ApiError(400, "This testimonial request has expired");
  }

  return request;
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
        completed_at: new Date()
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