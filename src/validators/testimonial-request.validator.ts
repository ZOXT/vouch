import { z } from "zod";

export const createTestimonialRequestSchema = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  clientEmail: z
    .string()
    .email("Invalid email address")
    .optional(),
  
  title: z.string().trim().max(200).optional(),
  message: z.string().trim().max(1000).optional(),
  questions: z.array(z.string().trim().min(1)).max(10).optional(),  
});
export type CreateTestimonialRequest = z.infer<typeof createTestimonialRequestSchema>