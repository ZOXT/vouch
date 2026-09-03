import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { slugify } from "../utils/slugify";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import { getCloudFrontUrl, getThumbnailUrl } from "../utils/media";
import { normalizeAllowedDomains } from "../utils/embed-domain";
import { assertCanCreateEmbedSection } from "./subscription.service";

export const EMBED_THEMES = [
  "minimal",
  "dark",
  "gradient",
  "editorial",
] as const;
export type EmbedTheme = (typeof EMBED_THEMES)[number];

const isEmbedTheme = (value: unknown): value is EmbedTheme =>
  EMBED_THEMES.includes(value as EmbedTheme);

interface CreateEmbedSectionRequest {
  title: string;
  displayStyle: "grid" | "carousel" | "list";
  theme?: EmbedTheme;
  testimonialIds: string[];
  captionsEnabled?: boolean;
}

export const createEmbedSection = async (
  userId: string,
  input: CreateEmbedSectionRequest,
) => {
  const { title, displayStyle, theme, testimonialIds, captionsEnabled } = input;

  const cleanTitle = title?.trim();

  if (!cleanTitle) {
    throw new ApiError(400, "Title is required");
  }

  if (!displayStyle || !["grid", "carousel", "list"].includes(displayStyle)) {
    throw new ApiError(
      400,
      "Valid displayStyle is required (grid, carousel, or list)",
    );
  }

  if (theme !== undefined && !isEmbedTheme(theme)) {
    throw new ApiError(400, "Valid theme is required");
  }

  if (
    !testimonialIds ||
    !Array.isArray(testimonialIds) ||
    testimonialIds.length === 0
  ) {
    throw new ApiError(400, "At least one testimonial ID is required");
  }

  const uniqueTestimonialIds = [...new Set(testimonialIds)];

  await assertCanCreateEmbedSection(userId);

  const testimonials = await prisma.testimonial.findMany({
    where: {
      id: {
        in: uniqueTestimonialIds,
      },

      user_id: userId,

      deleted_at: null,

      is_published: true,

      status: "completed",
    },

    select: {
      id: true,
    },
  });

  if (testimonials.length !== uniqueTestimonialIds.length) {
    const foundIds = new Set(testimonials.map((testimonial) => testimonial.id));

    const missingIds = uniqueTestimonialIds.filter((id) => !foundIds.has(id));

    logger.warn(
      {
        userId,
        requestedIds: uniqueTestimonialIds,
        missingIds,
      },
      "Invalid testimonials requested for embed section",
    );

    throw new ApiError(
      400,
      `Some testimonials are invalid or unavailable: ${missingIds.join(", ")}`,
    );
  }

  const baseSlug = slugify(cleanTitle) || `embed-${nanoid(8)}`;

  let publicId = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.embedSection.findUnique({
      where: {
        public_id: publicId,
      },

      select: {
        id: true,
      },
    });

    if (!existing) {
      break;
    }

    publicId = `${baseSlug}-${counter}`;
    counter++;
  }

  try {
    const embedSection = await prisma.embedSection.create({
      data: {
        user_id: userId,

        title: cleanTitle,

        public_id: publicId,

        layout: displayStyle,

        theme: theme ?? "minimal",

        is_active: true,

        captions_enabled: captionsEnabled ?? true,

        allowed_domains: [],

        testimonials: {
          create: uniqueTestimonialIds.map((testimonialId, index) => ({
            testimonial_id: testimonialId,
            position: index,
          })),
        },
      },

      include: {
        testimonials: {
          orderBy: {
            position: "asc",
          },

          include: {
            testimonial: {
              select: {
                id: true,
                client_name: true,
                video_key: true,
                thumbnail_key: true,
                duration_seconds: true,
                sentiment: true,
                industry: true,
                created_at: true,
              },
            },
          },
        },
      },
    });

    logger.info(
      {
        userId,
        embedSectionId: embedSection.id,
        publicId: embedSection.public_id,
        testimonialCount: embedSection.testimonials.length,
      },
      "Embed section created successfully",
    );

    return embedSection;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      logger.warn(
        {
          userId,
          publicId,
        },
        "Embed public ID collision detected",
      );

      throw new ApiError(
        409,
        "An embed with this identifier was created at the same time. Please try again.",
      );
    }

    throw error;
  }
};

export const getPublicEmbedSection = async (publicId: string) => {
  const embedSection = await prisma.embedSection.findFirst({
    where: {
      public_id: publicId,
      is_active: true,
    },
    select: {
      id: true,
      public_id: true,
      title: true,
      layout: true,
      theme: true,
      captions_enabled: true,

      testimonials: {
        orderBy: {
          position: "asc",
        },
        select: {
          position: true,

          testimonial: {
            select: {
              id: true,
              client_name: true,
              client_designation: true,
              video_key: true,
              thumbnail_key: true,
              duration_seconds: true,
              captions_key: true,
            },
          },
        },
      },
    },
  });

  if (!embedSection) {
    throw new ApiError(404, "Embed section not found");
  }

  await prisma.embedSection.update({
    where: { id: embedSection.id },
    data: { view_count: { increment: 1 } },
  });

  return {
    publicId: embedSection.public_id,
    title: embedSection.title,
    layout: embedSection.layout,
    theme: embedSection.theme,
    captionsEnabled: embedSection.captions_enabled,

    testimonials: embedSection.testimonials.map(
      ({ position, testimonial }) => ({
        position,
        id: testimonial.id,
        clientName: testimonial.client_name,
        clientDesignation: testimonial.client_designation,
        durationSeconds: testimonial.duration_seconds,
        hasCaptions: Boolean(testimonial.captions_key),

        thumbnailUrl: getThumbnailUrl(testimonial.thumbnail_key),
        videoUrl: getCloudFrontUrl(testimonial.video_key),
      }),
    ),
  };
};
interface UpdateEmbedSectionRequest {
  title?: string;
  displayStyle?: "grid" | "carousel" | "list";
  theme?: EmbedTheme;
  testimonialIds?: string[];
  allowedDomains?: string[];
  isActive?: boolean;
  captionsEnabled?: boolean;
}

export const updateEmbedSection = async (
  userId: string,
  embedSectionId: string,
  input: UpdateEmbedSectionRequest,
) => {
  const existingSection = await prisma.embedSection.findFirst({
    where: {
      id: embedSectionId,
      user_id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingSection) {
    throw new ApiError(404, "Embed section not found");
  }

  const updateData: Prisma.EmbedSectionUpdateInput = {};

  if (input.title !== undefined) {
    const title = input.title.trim();

    if (!title) {
      throw new ApiError(400, "Title cannot be empty");
    }

    updateData.title = title;
  }

  if (input.displayStyle !== undefined) {
    if (!["grid", "carousel", "list"].includes(input.displayStyle)) {
      throw new ApiError(
        400,
        "Valid displayStyle is required (grid, carousel, or list)",
      );
    }

    updateData.layout = input.displayStyle;
  }

  if (input.theme !== undefined) {
    if (!isEmbedTheme(input.theme)) {
      throw new ApiError(400, "Valid theme is required");
    }

    updateData.theme = input.theme;
  }

  if (input.allowedDomains !== undefined) {
    updateData.allowed_domains = normalizeAllowedDomains(input.allowedDomains);
  }

  if (input.isActive !== undefined) {
    updateData.is_active = input.isActive;
  }

  if (input.captionsEnabled !== undefined) {
    updateData.captions_enabled = input.captionsEnabled;
  }

  if (input.testimonialIds !== undefined) {
    if (
      !Array.isArray(input.testimonialIds) ||
      input.testimonialIds.length === 0
    ) {
      throw new ApiError(400, "At least one testimonial ID is required");
    }

    const uniqueIds = [...new Set(input.testimonialIds)];

    const testimonials = await prisma.testimonial.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
        user_id: userId,
        deleted_at: null,
        is_published: true,
        status: "completed",
      },
      select: {
        id: true,
      },
    });

    if (testimonials.length !== uniqueIds.length) {
      const foundIds = new Set(
        testimonials.map((testimonial) => testimonial.id),
      );

      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

      throw new ApiError(
        400,
        `Some testimonials are invalid or unavailable: ${missingIds.join(", ")}`,
      );
    }

    updateData.testimonials = {
      deleteMany: {},

      create: uniqueIds.map((testimonialId, index) => ({
        testimonial: {
          connect: {
            id: testimonialId,
          },
        },
        position: index,
      })),
    };
  }

  const updatedSection = await prisma.embedSection.update({
    where: {
      id: existingSection.id,
    },

    data: updateData,

    include: {
      testimonials: {
        orderBy: {
          position: "asc",
        },

        include: {
          testimonial: {
            select: {
              id: true,
              client_name: true,
              video_key: true,
              thumbnail_key: true,
              duration_seconds: true,
              sentiment: true,
              industry: true,
            },
          },
        },
      },
    },
  });

  logger.info(
    {
      userId,
      embedSectionId: updatedSection.id,
    },
    "Embed section updated successfully",
  );

  return updatedSection;
};

const sectionInclude = {
  testimonials: {
    orderBy: { position: "asc" as const },
    include: {
      testimonial: {
        select: {
          id: true,
          client_name: true,
          video_key: true,
          thumbnail_key: true,
          duration_seconds: true,
          is_published: true,
          status: true,
        },
      },
    },
  },
};

export const getEmbedSection = async (userId: string, id: string) => {
  const section = await prisma.embedSection.findFirst({
    where: { id, user_id: userId },
    include: sectionInclude,
  });
  if (!section) throw new ApiError(404, "Embed section not found");
  return section;
};

export const listEmbedSections = async (userId: string) =>
  prisma.embedSection.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: sectionInclude,
  });

export const deleteEmbedSection = async (userId: string, embedId: string) => {
  if (!embedId) {
    throw new ApiError(400, "Embed section ID is required");
  }

  const existing = await prisma.embedSection.findFirst({
    where: {
      id: embedId,
      user_id: userId,
    },
    select: {
      id: true,
      title: true,
      public_id: true,
      user_id: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Embed section not found");
  }

  const testimonialCount = await prisma.embedSectionTestimonial.count({
    where: {
      embed_section_id: embedId,
    },
  });

  logger.info(
    {
      userId,
      embedId,
      publicId: existing.public_id,
      title: existing.title,
      testimonialCount,
    },
    "Deleting embed section",
  );

  await prisma.embedSection.delete({
    where: {
      id: embedId,
    },
  });

  logger.info(
    {
      userId,
      embedId,
      publicId: existing.public_id,
      title: existing.title,
    },
    "Embed section deleted successfully",
  );

  return {
    success: true,
    message: "Embed section deleted successfully",
    deleted: {
      id: existing.id,
      title: existing.title,
      public_id: existing.public_id,
    },
  };
};
