import { z } from "zod";
import { MAX_TESTIMONIAL_DURATION_SECONDS } from "../utils/media-limits";

export const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  token: z.string().min(1, "Token is required"),
});

export const confirmUploadSchema = z.object({
  token: z.string().min(1, "Token is required"),
  key: z.string().min(1, "S3 key is required"),
  duration: z
    .number()
    .int()
    .positive()
    .max(MAX_TESTIMONIAL_DURATION_SECONDS, "Testimonials must be 2 minutes or shorter")
    .optional(),
  mimeType: z.string().trim().max(100).optional(),
  clientDesignation: z.string().trim().max(120).optional(),
  consent: z.literal(true, { message: "You must consent to the testimonial being used for marketing" }),
});


export type ConfirmTestimonialUpload = z.infer<typeof confirmUploadSchema>
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>