// src/validators/password.validator.ts
import { z } from "zod";

/**
 * Password strength requirements shared by registration and
 * change-password flows. The superRefine reports every unmet
 * requirement at once so the client can show a full checklist.
 */
export const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "lowercase", label: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "uppercase", label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "number", label: "At least one number", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "At least one special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export const strongPasswordSchema = z
  .string()
  .max(128, "Password cannot exceed 128 characters")
  .superRefine((password, ctx) => {
    const unmet = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password));
    if (unmet.length === 0) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Password must include: ${unmet.map((r) => r.label).join("; ")}.`,
    });
  });

export type StrongPassword = z.infer<typeof strongPasswordSchema>;