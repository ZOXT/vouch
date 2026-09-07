import { strongPasswordSchema } from "./password.validator";
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.trim().toLowerCase()),

  password: strongPasswordSchema,

  role: z.enum(["freelancer", "agency"]),

  company_name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string() 
    .email("Invalid email address")
    .transform((email) => email.trim().toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

export const verifyOTPValidator = z.object({
 userId:z.string().uuid(),
 otp:z.string().length(6)
});

export const resendOTPValidator = z.object({
  userId:z.string().uuid()
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((email) => email.trim().toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Invalid reset token"),
  password: strongPasswordSchema,
});

// TypeScript types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;