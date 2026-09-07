import { apiFetch } from "@/lib/api/client";
import type {
  TestimonialDetail,
  TestimonialListResult,
  TestimonialStatus,
} from "@/lib/api/types";

export interface TestimonialQuery {
  page?: number;
  limit?: number;
  status?: TestimonialStatus;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

const buildQuery = (query: TestimonialQuery): string => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.status) params.set("status", query.status);
  if (query.isPublished !== undefined) params.set("isPublished", String(query.isPublished));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.search?.trim()) params.set("search", query.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const testimonialsApi = {
  list: (query: TestimonialQuery = {}) =>
    apiFetch<TestimonialListResult>(`/testimonials${buildQuery(query)}`),

  get: (id: string) => apiFetch<TestimonialDetail>(`/testimonials/${id}`),

  togglePublish: (id: string) =>
    apiFetch<{ id: string; isPublished: boolean; publishedAt: string | null }>(
      `/testimonials/${id}/publish`,
      { method: "PATCH" },
    ),

  remove: (id: string) =>
    apiFetch<null>(`/testimonials/${id}`, { method: "DELETE" }),
};
