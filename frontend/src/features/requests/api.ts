import { apiFetch } from "@/lib/api/client";
import type {
  PublicTestimonialRequest,
  TestimonialRequest,
  UploadUrlResult,
} from "@/lib/api/types";

export type TestimonialRequestWithUrl = TestimonialRequest & { url: string };

export const requestsApi = {
  list: () => apiFetch<TestimonialRequestWithUrl[]>("/testimonial-requests"),

  create: (input: {
    clientName: string;
    clientEmail?: string;
    title?: string;
    message?: string;
    questions?: string[];
  }) =>
    apiFetch<{ request: TestimonialRequest; url: string }>("/testimonial-requests", {
      method: "POST",
      body: input,
    }),

  // Public (unauthenticated) endpoints for the submission flow
  getPublic: (token: string) =>
    apiFetch<PublicTestimonialRequest>(`/testimonial-requests/r/${token}`, {
      skipAuthRetry: true,
    }),

  getUploadUrl: (token: string, fileName: string, fileType: string) =>
    apiFetch<UploadUrlResult>("/testimonials/get-upload-url", {
      method: "POST",
      body: { token, fileName, fileType },
      skipAuthRetry: true,
    }),

  confirmUpload: (input: {
    token: string;
    key: string;
    duration?: number;
    mimeType?: string;
    clientDesignation?: string;
    consent: boolean;
  }) =>
    apiFetch<unknown>("/testimonials/confirm-upload", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),
};
