import { z } from "zod";

const layout = z.enum(["grid", "carousel", "list"]);
const domain = z.string().trim().min(1).max(253);

export const createEmbedSectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  displayStyle: layout,
  testimonialIds: z.array(z.string().uuid()).min(1).max(100),
});

export const updateEmbedSectionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  displayStyle: layout.optional(),
  testimonialIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  allowedDomains: z.array(domain).max(50).optional(),
  isActive: z.boolean().optional(),
});
