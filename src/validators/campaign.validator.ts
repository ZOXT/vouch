import { z } from "zod";

const title = z.string().trim().min(1, "Title is required").max(200);
const description = z.string().trim().max(5_000).nullable();
const questions = z.array(z.string().trim().min(1)).max(10).nullable();
const maxDuration = z.number().int().positive().max(3_600);

const submissionTypes = (value: { allowVideo?: boolean; allowText?: boolean }) =>
  value.allowVideo !== false || value.allowText !== false;

export const createCampaignSchema = z
  .object({
    title,
    description: description.optional(),
    questions: questions.optional(),
    allowVideo: z.boolean(),
    allowText: z.boolean(),
    maxDuration,
  })
  .refine(submissionTypes, {
    message: "At least one submission type must be enabled",
  });

export const updateCampaignSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    questions: questions.optional(),
    isActive: z.boolean().optional(),
    allowVideo: z.boolean().optional(),
    allowText: z.boolean().optional(),
    maxDuration: maxDuration.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );

export const getCampaignUploadUrlSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255),
  fileType: z.string().trim().min(1, "File type is required").max(100),
});

export const submitCampaignTestimonialSchema = z.object({
  s3Key: z.string().trim().min(1, "S3 key is required").max(1_024),
  clientName: z.string().trim().min(1, "Client name is required").max(200),
  clientEmail: z.string().trim().email("Invalid client email").max(320).optional(),
  duration: z.number().int().positive().max(3_600).optional(),
  mimeType: z.string().trim().max(100).optional(),
});
