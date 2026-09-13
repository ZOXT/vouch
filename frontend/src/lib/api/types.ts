/** API contracts mirroring the backend. Backend is the source of truth. */

export interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export type Role = "freelancer" | "agency";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  company_name: string | null;
  company_url: string | null;
  avatar_url: string | null;
  slug: string;
  is_verified: boolean;
  created_at: string;
}

export interface LoginResult {
  requiresVerification: boolean;
  userId?: string;
  email?: string;
  user?: User;
}

export type TestimonialStatus =
  | "pending"
  | "media_processing"
  | "transcribing"
  | "ai_processing"
  | "completed"
  | "failed";

export type Sentiment = "positive" | "neutral" | "negative" | string;

export interface TestimonialListItem {
  id: string;
  client_name: string;
  client_designation: string | null;
  client_email: string | null;
  thumbnail_url: string | null;
  status: TestimonialStatus;
  duration_seconds: number | null;
  sentiment: Sentiment | null;
  industry: string | null;
  pain_points: string[];
  outcomes: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  request: {
    token: string;
    expires_at: string;
    completed_at: string | null;
  } | null;
}

export interface TestimonialDetail {
  id: string;
  client_name: string;
  client_designation: string | null;
  client_email: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  status: TestimonialStatus;
  duration_seconds: number | null;
  mime_type: string | null;
  transcript: string | null;
  summary: string | null;
  sentiment: Sentiment | null;
  industry: string | null;
  pain_points: string[];
  outcomes: string[];
  objections: string[];
  keywords: string[];
  customer_type: string | null;
  confidence_score: number | null;
  language: string | null;
  is_published: boolean;
  published_at: string | null;
  failure_reason: string | null;
  captions_key: string | null;
  created_at: string;
  request: {
    token: string;
    expires_at: string;
    completed_at: string | null;
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface TestimonialListResult {
  data: TestimonialListItem[];
  pagination: Pagination;
}

export interface TestimonialRequest {
  id: string;
  client_name: string;
  client_email: string | null;
  token: string;
  status: "pending" | "completed" | "expired";
  expires_at: string;
  completed_at: string | null;
  title: string | null;
  message: string | null;
  questions: string[] | null;
  created_at: string;
}

export interface PublicTestimonialRequest {
  clientName: string;
  status: string;
  expiresAt: string;
  title: string | null;
  message: string | null;
  questions: string[] | null;
  logoUrl: string | null;
  companyName: string | null;
  companyUrl: string | null;
}

export interface UploadUrlResult {
  url: string;
  key: string;
  maxFileSizeBytes?: number;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  questions: string[] | null;
  is_active: boolean;
  allow_video: boolean;
  allow_text: boolean;
  max_duration: number;
  view_count: number;
  submission_count: number;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface PublicCampaign {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  questions: string[] | null;
  allow_video: boolean;
  allow_text: boolean;
  max_duration: number;
}

export type EmbedLayout = "grid" | "carousel" | "list";

export type EmbedTheme = "minimal" | "dark" | "gradient" | "editorial";

export interface EmbedTestimonial {
  position: number;
  testimonial: {
    id: string;
    client_name: string;
    video_key: string | null;
    thumbnail_key: string | null;
    duration_seconds: number | null;
    is_published: boolean;
    status: TestimonialStatus;
  };
}

export interface EmbedSection {
  id: string;
  user_id: string;
  title: string | null;
  public_id: string;
  layout: EmbedLayout;
  theme: EmbedTheme;
  is_active: boolean;
  captions_enabled: boolean;
  show_summary: boolean;
  max_width: number | null;
  title_align: "left" | "center";
  allowed_domains: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  testimonials: EmbedTestimonial[];
}

export type Plan = "free" | "pro";

export interface SubscriptionStatus {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  limits: {
    testimonials: number;
    campaigns: number;
    embedSections: number;
  };
  usage: {
    testimonials: number;
    campaigns: number;
    embedSections: number;
  };
}

export interface SearchResult {
  id: string;
  clientName: string;
  summary: string;
  transcript: string;
  sentiment: string;
  industry: string;
  keywords: string[];
  confidenceScore: number;
  similarity: number;
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}
