import { z } from "zod";

const layout = z.enum(["grid", "carousel", "list"]);
const theme = z.enum(["minimal", "dark", "gradient", "editorial"]);
const domain = z.string().trim().min(1).max(253);

export const createEmbedSectionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  displayStyle: layout,
  theme: theme.optional(),
  testimonialIds: z.array(z.string().uuid()).min(1).max(100),
  captionsEnabled: z.boolean().optional(),
});

export const updateEmbedSectionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  displayStyle: layout.optional(),
  theme: theme.optional(),
  testimonialIds: z.array(z.string().uuid()).min(1).max(100).optional(),
  allowedDomains: z.array(domain).max(50).optional(),
  isActive: z.boolean().optional(),
  captionsEnabled: z.boolean().optional(),
});

export const previewEmbedSectionSchema = z.object({
  title: z.string().trim().max(200).optional(),
  displayStyle: layout.optional(),
  theme: theme.optional(),
  testimonialIds: z.array(z.string().uuid()).min(1).max(100),
  captionsEnabled: z.boolean().optional(),
});
