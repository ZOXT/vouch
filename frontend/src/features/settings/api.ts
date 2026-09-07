import { apiFetch } from "@/lib/api/client";
import type { User, UploadUrlResult } from "@/lib/api/types";

export const settingsApi = {
  getMe: () => apiFetch<User>("/users/me"),

  updateProfile: (input: {
    name?: string;
    company_name?: string | null;
    company_url?: string | null;
  }) =>
    apiFetch<User>("/users/me/profile", {
      method: "PATCH",
      body: input,
    }),

  getAvatarUploadUrl: (fileType: string) =>
    apiFetch<UploadUrlResult>("/users/me/avatar/upload-url", {
      method: "POST",
      body: { fileType },
    }),

  confirmAvatarUpload: (key: string) =>
    apiFetch<{ key: string }>("/users/me/avatar", {
      method: "PATCH",
      body: { key },
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<null>("/users/me/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),
};