import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { mediaQueue } from "../queues/media.queue";
import {
  createPresignedUploadUrl,
  maxFileSizeBytes,
  verifyS3ObjectExists,
} from "./s3.service";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { getCampaignUrl } from "../utils/url";

export interface CampaignInput {
  title: string;
  description?: string | null;
  questions?: Prisma.InputJsonValue | null;
  allowVideo: boolean;
  allowText: boolean;
  maxDuration: number;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string | null;
  questions?: Prisma.InputJsonValue | null;
  isActive?: boolean;
  allowVideo?: boolean;
  allowText?: boolean;
  maxDuration?: number;
}

export interface CampaignTestimonialInput {
  s3Key: string;
  clientName: string;
  clientEmail?: string;
  duration?: number;
  mimeType?: string;
}

const requireUserId = (userId: string) => {
  if (!userId) throw new ApiError(400, "Invalid or unauthorized request");
};

const requireCampaignId = (campaignId: string) => {
  if (!campaignId?.trim()) throw new ApiError(400, "Campaign ID is required");
};

const validateMaxDuration = (maxDuration: number) => {
  if (!Number.isInteger(maxDuration) || maxDuration <= 0) {
    throw new ApiError(400, "Invalid maximum duration");
  }
};

const createUniqueSlug = async (title: string) => {
  const baseSlug = slugify(title) || `campaign-${nanoid(8)}`;
  let slug = baseSlug;

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) return slug;

    slug = `${baseSlug}-${nanoid(4)}`;
  }
};

const findActiveCampaignBySlug = async (slug: string) => {
  const campaign = await prisma.campaign.findFirst({
    where: { slug, is_active: true },
    select: { id: true, user_id: true, allow_video: true, max_duration: true },
  });

  if (!campaign) throw new ApiError(404, "Campaign not found");
  return campaign;
};

const withPublicUrl = <T extends { slug: string }>(campaign: T) => ({
  ...campaign,
  url: getCampaignUrl(campaign.slug),
});

const findOwnedCampaign = async (userId: string, campaignId: string) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, user_id: userId },
  });

  if (!campaign) throw new ApiError(404, "Campaign not found");
  return campaign;
};

export const createCampaign = async (userId: string, input: CampaignInput) => {
  requireUserId(userId);

  const title = input.title?.trim();
  if (!title) throw new ApiError(400, "Title is required");
  validateMaxDuration(input.maxDuration);

  if (!input.allowVideo && !input.allowText) {
    throw new ApiError(400, "At least one submission type must be enabled");
  }

  const slug = await createUniqueSlug(title);

  try {
    const campaign = await prisma.campaign.create({
      data: {
        user_id: userId,
        title,
        description: input.description?.trim() || null,
        questions: input.questions ?? Prisma.JsonNull,
        slug,
        allow_video: input.allowVideo,
        allow_text: input.allowText,
        max_duration: input.maxDuration,
      },
    });

    logger.info({ userId, campaignId: campaign.id, slug }, "Campaign created");
    return withPublicUrl(campaign);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      logger.warn({ userId, slug }, "Campaign slug collision detected");
      throw new ApiError(409, "Campaign slug collision. Please try again.");
    }

    throw error;
  }
};

export const getCampaigns = async (userId: string) => {
  requireUserId(userId);

  const campaigns = await prisma.campaign.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return campaigns.map(withPublicUrl);
};

export const getCampaignById = async (userId: string, campaignId: string) => {
  requireUserId(userId);
  requireCampaignId(campaignId);
  const campaign = await findOwnedCampaign(userId, campaignId);
  return withPublicUrl(campaign);
};

export const updateCampaign = async (
  userId: string,
  campaignId: string,
  input: UpdateCampaignInput,
) => {
  requireUserId(userId);
  requireCampaignId(campaignId);
  const existingCampaign = await findOwnedCampaign(userId, campaignId);

  const allowVideo = input.allowVideo ?? existingCampaign.allow_video;
  const allowText = input.allowText ?? existingCampaign.allow_text;
  if (!allowVideo && !allowText) {
    throw new ApiError(400, "At least one submission type must be enabled");
  }

  const data: Prisma.CampaignUpdateInput = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new ApiError(400, "Title cannot be empty");
    data.title = title;
  }
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.questions !== undefined) data.questions = input.questions ?? Prisma.JsonNull;
  if (input.isActive !== undefined) data.is_active = input.isActive;
  if (input.allowVideo !== undefined) data.allow_video = input.allowVideo;
  if (input.allowText !== undefined) data.allow_text = input.allowText;
  if (input.maxDuration !== undefined) {
    validateMaxDuration(input.maxDuration);
    data.max_duration = input.maxDuration;
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaignId },
    data,
  });

  logger.info({ userId, campaignId }, "Campaign updated");
  return updatedCampaign;
};

export const deleteCampaign = async (userId: string, campaignId: string) => {
  requireUserId(userId);
  requireCampaignId(campaignId);
  const campaign = await findOwnedCampaign(userId, campaignId);

  await prisma.$transaction([
    prisma.testimonial.updateMany({
      where: { campaign_id: campaign.id },
      data: { campaign_id: null },
    }),
    prisma.campaign.delete({ where: { id: campaign.id } }),
  ]);
  logger.info({ userId, campaignId: campaign.id, slug: campaign.slug }, "Campaign deleted");

  return { success: true };
};

export const getPublicCampaign = async (slug: string) => {
  if (!slug?.trim()) throw new ApiError(400, "Campaign slug is required");

  const campaign = await prisma.campaign.findFirst({
    where: { slug, is_active: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      questions: true,
      allow_video: true,
      allow_text: true,
      max_duration: true,
    },
  });

  if (!campaign) throw new ApiError(404, "Campaign not found");

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { view_count: { increment: 1 } },
  });

  logger.info({ campaignId: campaign.id, slug: campaign.slug }, "Public campaign viewed");
  return campaign;
};

export const generateCampaignUploadUrl = async (
  slug: string,
  fileName: string,
  fileType: string,
) => {
  if (!slug?.trim()) throw new ApiError(400, "Campaign slug is required");
  if (!fileName?.trim()) throw new ApiError(400, "File name is required");
  if (!env.ALLOWED_VIDEO_TYPES.includes(fileType)) {
    throw new ApiError(
      400,
      `File type "${fileType}" not supported. Allowed: ${env.ALLOWED_VIDEO_TYPES.join(", ")}`,
    );
  }

  const campaign = await findActiveCampaignBySlug(slug);
  if (!campaign.allow_video) {
    throw new ApiError(400, "This campaign does not accept video submissions");
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Namespaced per campaign so submissions can verify ownership of the key.
  const key = `originals/${campaign.user_id}/campaigns/${campaign.id}/${nanoid()}/${sanitizedFileName}`;

  const url = await createPresignedUploadUrl(key, fileType);

  logger.info({ campaignId: campaign.id, key }, "Generated campaign upload URL");

  return { url, key, maxFileSizeBytes };
};

export const submitCampaignTestimonial = async (
  slug: string,
  input: CampaignTestimonialInput,
) => {
  if (!slug?.trim()) throw new ApiError(400, "Campaign slug is required");

  const s3Key = input.s3Key?.trim();
  const clientName = input.clientName?.trim();
  if (!s3Key) throw new ApiError(400, "S3 key is required");
  if (!clientName) throw new ApiError(400, "Client name is required");
  if (input.duration !== undefined && (!Number.isInteger(input.duration) || input.duration <= 0)) {
    throw new ApiError(400, "Invalid testimonial duration");
  }

  const campaign = await findActiveCampaignBySlug(slug);
  if (!campaign.allow_video) {
    throw new ApiError(400, "This campaign does not accept video submissions");
  }
  if (input.duration !== undefined && input.duration > campaign.max_duration) {
    throw new ApiError(400, "Testimonial exceeds the campaign maximum duration");
  }

  // Only accept uploads issued through this campaign's upload-url endpoint.
  const expectedPrefix = `originals/${campaign.user_id}/campaigns/${campaign.id}/`;
  if (!s3Key.startsWith(expectedPrefix)) {
    throw new ApiError(403, "The uploaded file does not belong to this campaign");
  }

  const objectExists = await verifyS3ObjectExists(s3Key);
  if (!objectExists) {
    throw new ApiError(400, "Uploaded video could not be found. Please upload it again.");
  }

  const testimonial = await prisma.$transaction(async (tx) => {
    const created = await tx.testimonial.create({
      data: {
        user_id: campaign.user_id,
        campaign_id: campaign.id,
        client_name: clientName,
        client_email: input.clientEmail?.trim() || null,
        video_key: s3Key,
        duration_seconds: input.duration,
        mime_type: input.mimeType?.trim() || null,
        status: "pending",
      },
    });

    await tx.campaign.update({
      where: { id: campaign.id },
      data: { submission_count: { increment: 1 } },
    });

    return created;
  });

  await mediaQueue.add("process", { testimonialId: testimonial.id });
  logger.info(
    { campaignId: campaign.id, testimonialId: testimonial.id },
    "Campaign testimonial submitted and media job queued",
  );

  return {
    id: testimonial.id,
    status: testimonial.status,
    message: "Testimonial submitted successfully and processing has started",
  };
};
