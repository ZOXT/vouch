import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { TestimonialRequest } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export const createTestimonialRequest = async ( userId: string, clientName: string, clientEmail?: string): Promise<{
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