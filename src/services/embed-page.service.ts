import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { getCloudFrontUrl, getThumbnailUrl } from "../utils/media";
import { downloadText } from "./s3.service";
import { getPublicEmbedSection } from "./embed-section.service";

export interface EmbedWallData {
  publicId: string;
  title: string | null;
  layout: string;
  theme: string;
  captionsEnabled: boolean;
  allowedDomains: string[];
  testimonials: {
    id: string;
    clientName: string;
    clientDesignation: string | null;
    durationSeconds: number | null;
    hasCaptions: boolean;
    thumbnailUrl: string | null;
    videoUrl: string | null;
  }[];
}

/**
 * Data for the framed wall page. Counts as a view, same semantics as the
 * legacy JSON embed endpoint.
 */
export const getEmbedWallData = async (publicId: string): Promise<EmbedWallData> => {  const section = await getPublicEmbedSection(publicId);

  const record = await prisma.embedSection.findUnique({
    where: { public_id: publicId },
    select: { allowed_domains: true },
  });

  return {
    publicId: section.publicId,
    title: section.title,
    layout: section.layout,
    theme: section.theme,
    captionsEnabled: section.captionsEnabled,
    allowedDomains: record?.allowed_domains ?? [],
    testimonials: section.testimonials.map((testimonial) => ({
      id: testimonial.id,
      clientName: testimonial.clientName,
      clientDesignation: testimonial.clientDesignation,
      durationSeconds: testimonial.durationSeconds,
      hasCaptions: testimonial.hasCaptions,
      thumbnailUrl: testimonial.thumbnailUrl,
      videoUrl: testimonial.videoUrl,
    })),
  };
};

export interface EmbedWallPreviewInput {
  title?: string | null;
  layout: string;
  theme: string;
  captionsEnabled?: boolean;
  testimonialIds: string[];
}

export const previewEmbedWall = async (
  userId: string,
  input: EmbedWallPreviewInput,
): Promise<EmbedWallData> => {
  const uniqueIds = [...new Set(input.testimonialIds)];

  const testimonials = await prisma.testimonial.findMany({
    where: {
      id: { in: uniqueIds },
      user_id: userId,
      deleted_at: null,
      is_published: true,
      status: "completed",
    },
    select: {
      id: true,
      client_name: true,
      client_designation: true,
      thumbnail_key: true,
      video_key: true,
      duration_seconds: true,
      captions_key: true,
    },
  });

  const byId = new Map(testimonials.map((t) => [t.id, t]));
  const ordered = uniqueIds.map((id) => byId.get(id)).filter((t) => t !== undefined);

  return {
    publicId: "preview",
    title: input.title?.trim() || null,
    layout: input.layout,
    theme: input.theme,
    captionsEnabled: input.captionsEnabled ?? true,
    allowedDomains: [],
    testimonials: ordered.map((t) => ({
      id: t.id,
      clientName: t.client_name,
      clientDesignation: t.client_designation,
      durationSeconds: t.duration_seconds,
      hasCaptions: Boolean(t.captions_key),
      thumbnailUrl: getThumbnailUrl(t.thumbnail_key),
      videoUrl: getCloudFrontUrl(t.video_key),
    })),
  };
};

const findSectionTestimonial = async (publicId: string, testimonialId: string) => {
  const entry = await prisma.embedSectionTestimonial.findFirst({
    where: {
      testimonial_id: testimonialId,
      embedSection: {
        public_id: publicId,
        is_active: true,
      },
      testimonial: {
        deleted_at: null,
        is_published: true,
        status: "completed",
      },
    },
    select: {
      testimonial: {
        select: {
          id: true,
          client_name: true,
          client_designation: true,
          video_key: true,
          duration_seconds: true,
          captions_key: true,
        },
      },
      embedSection: {
        select: {
          captions_enabled: true,
          allowed_domains: true,
        },
      },
    },
  });

  if (!entry) {
    throw new ApiError(404, "Testimonial not found in this embed");
  }

  return entry;
};

export interface EmbedPlayerData {
  publicId: string;
  testimonialId: string;
  clientName: string;
  clientDesignation: string | null;
  durationSeconds: number | null;
  videoUrl: string;
  captionsEnabled: boolean;
  hasCaptions: boolean;
  allowedDomains: string[];
}

/** Data for the framed video player page. Does not increment the view count. */
export const getEmbedPlayerData = async (
  publicId: string,
  testimonialId: string,
): Promise<EmbedPlayerData> => {
  const entry = await findSectionTestimonial(publicId, testimonialId);
  const videoUrl = getCloudFrontUrl(entry.testimonial.video_key);

  if (!videoUrl) {
    throw new ApiError(404, "This testimonial has no video");
  }

  return {
    publicId,
    testimonialId,
    clientName: entry.testimonial.client_name,
    clientDesignation: entry.testimonial.client_designation,
    durationSeconds: entry.testimonial.duration_seconds,
    videoUrl,
    captionsEnabled: entry.embedSection.captions_enabled,
    hasCaptions: Boolean(entry.testimonial.captions_key),
    allowedDomains: entry.embedSection.allowed_domains,
  };
};

/**
 * Raw WebVTT for a testimonial in an embed. Honors the embed's captions
 * toggle: captions are not served when the owner disabled them.
 */
export const getEmbedCaptionsText = async (
  publicId: string,
  testimonialId: string,
): Promise<string> => {
  const entry = await findSectionTestimonial(publicId, testimonialId);

  if (!entry.embedSection.captions_enabled || !entry.testimonial.captions_key) {
    throw new ApiError(404, "Captions not available for this testimonial");
  }

  return downloadText(entry.testimonial.captions_key);
};
