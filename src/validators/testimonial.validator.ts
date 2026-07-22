import { z } from "zod";

export const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  token: z.string().min(1, "Token is required"),
});

export const confirmUploadSchema = z.object({
  token: z.string().min(1, "Token is required"),
  key: z.string().min(1, "S3 key is required"),
  // fileName: z.string().min(1),
  // fileType: z.string().min(1),
  // duration: z.number().optional(),
});


export type ConfirmTestimonialUpload = z.infer<typeof confirmUploadSchema>
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>