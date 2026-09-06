// src/validators/user.validator.ts
import { z } from "zod";
import { strongPasswordSchema } from "./password.validator";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters").optional(),
  company_name: z.union([z.literal(""), z.string().trim().min(2, "Company name must be at least 2 characters").max(100, "Company name cannot exceed 100 characters")]).optional().transform((v) => (v === "" ? null : v)),
  company_url: z.union([z.literal(""), z.string().trim().url("Company URL must be a valid URL").max(300, "Company URL cannot exceed 300 characters")]).optional().transform((v) => (v === "" ? null : v)),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const generateAvatarUploadUrlSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
});
export type GenerateAvatarUploadUrlInput = z.infer<typeof generateAvatarUploadUrlSchema>;

export const confirmAvatarUploadSchema = z.object({
  key: z.string().min(1, "Avatar key is required"),
});
export type ConfirmAvatarUploadInput = z.infer<typeof confirmAvatarUploadSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;