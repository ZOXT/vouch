import { apiFetch } from "@/lib/api/client";
import type { Campaign, PublicCampaign, UploadUrlResult } from "@/lib/api/types";

export interface CampaignInput {
  title: string;
  description?: string | null;
  questions?: string[] | null;
  allowVideo: boolean;
  allowText: boolean;
  maxDuration: number;
}

export const campaignsApi = {
  list: () => apiFetch<Campaign[]>("/campaigns"),

  get: (id: string) => apiFetch<Campaign>(`/campaigns/${id}`),

  create: (input: CampaignInput) =>
    apiFetch<Campaign>("/campaigns", { method: "POST", body: input }),

  update: (id: string, input: Partial<CampaignInput & { isActive: boolean }>) =>
    apiFetch<Campaign>(`/campaigns/${id}`, { method: "PATCH", body: input }),

  remove: (id: string) => apiFetch<null>(`/campaigns/${id}`, { method: "DELETE" }),

  // Public (unauthenticated) endpoints
  getPublic: (slug: string) =>
    apiFetch<PublicCampaign>(`/campaigns/public/${slug}`, { skipAuthRetry: true }),

  getPublicUploadUrl: (slug: string, fileName: string, fileType: string) =>
    apiFetch<UploadUrlResult>(`/campaigns/public/${slug}/upload-url`, {
      method: "POST",
      body: { fileName, fileType },
      skipAuthRetry: true,
    }),

  submitPublic: (
    slug: string,
    input: {
      s3Key: string;
      clientName: string;
      clientDesignation?: string;
      clientEmail?: string;
      duration?: number;
      mimeType?: string;
      consent: boolean;
    },
  ) =>
    apiFetch<unknown>(`/campaigns/public/${slug}/submissions`, {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),
};
