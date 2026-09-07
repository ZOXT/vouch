import { apiFetch } from "@/lib/api/client";
import type { LoginResult, Role, User } from "@/lib/api/types";

export const authApi = {
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    company_name?: string;
  }) =>
    apiFetch<User>("/auth/register", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),

  login: (input: { email: string; password: string }) =>
    apiFetch<LoginResult | { user: User }>("/auth/login", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),

  verifyEmail: (userId: string, otp: string) =>
    apiFetch<{ user: User }>("/auth/verify-email", {
      method: "POST",
      body: { userId, otp },
      skipAuthRetry: true,
    }),

  resendOtp: (userId: string) =>
    apiFetch<null>("/auth/resend-otp", {
      method: "POST",
      body: { userId },
      skipAuthRetry: true,
    }),

  logout: () =>
    apiFetch<null>("/auth/logout", { method: "POST", skipAuthRetry: true }),

  refresh: () =>
    apiFetch<{ user: User }>("/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    }),

  forgotPassword: (email: string) =>
    apiFetch<null>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      skipAuthRetry: true,
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<null>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      skipAuthRetry: true,
    }),
};
