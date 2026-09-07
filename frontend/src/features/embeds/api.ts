import { apiFetch } from "@/lib/api/client";
import type { EmbedLayout, EmbedSection, EmbedTheme } from "@/lib/api/types";

export interface EmbedSectionInput {
  title: string;
  displayStyle: EmbedLayout;
  theme?: EmbedTheme;
  testimonialIds: string[];
  captionsEnabled?: boolean;
}

export interface EmbedSectionUpdateInput {
  title?: string;
  displayStyle?: EmbedLayout;
  theme?: EmbedTheme;
  testimonialIds?: string[];
  captionsEnabled?: boolean;
  allowedDomains?: string[];
  isActive?: boolean;
}

export const embedsApi = {
  list: () => apiFetch<EmbedSection[]>("/embed-sections"),

  get: (id: string) => apiFetch<EmbedSection>(`/embed-sections/${id}`),

  create: (input: EmbedSectionInput) =>
    apiFetch<EmbedSection>("/embed-sections", { method: "POST", body: input }),

  update: (id: string, input: EmbedSectionUpdateInput) =>
    apiFetch<EmbedSection>(`/embed-sections/${id}`, { method: "PATCH", body: input }),

  preview: (input: EmbedSectionInput) =>
    apiFetch<{ html: string }>("/embed-sections/preview", {
      method: "POST",
      body: { ...input, title: input.title?.trim() || undefined },
    }),

  remove: (id: string) => apiFetch<null>(`/embed-sections/${id}`, { method: "DELETE" }),
};

export const embedSnippet = (origin: string, publicId: string): string =>
  `<script src="${origin}/embed.js" async></script>\n<div data-vouch-id="${publicId}"></div>`;
