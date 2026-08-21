// src/validators/user.validator.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  company_name: z.string().min(2, "Company name must be at least 2 characters").optional(),
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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;