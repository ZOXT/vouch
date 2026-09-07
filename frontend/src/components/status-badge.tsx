import { Badge } from "@/components/ui/badge";
import type { TestimonialStatus } from "@/lib/api/types";

const statusConfig: Record<TestimonialStatus, { label: string; tone: "gray" | "green" | "amber" | "red" | "brand" | "blue" }> = {
  pending: { label: "Pending", tone: "gray" },
  media_processing: { label: "Processing", tone: "blue" },
  transcribing: { label: "Transcribing", tone: "blue" },
  ai_processing: { label: "Analyzing", tone: "brand" },
  completed: { label: "Ready", tone: "green" },
  failed: { label: "Failed", tone: "red" },
};

export const StatusBadge = ({ status }: { status: TestimonialStatus }) => {
  const config = statusConfig[status] ?? { label: status, tone: "gray" as const };
  return <Badge tone={config.tone}>{config.label}</Badge>;
};

export const SentimentBadge = ({ sentiment }: { sentiment: string | null }) => {
  if (!sentiment) return null;
  const tone = sentiment === "positive" ? "green" : sentiment === "negative" ? "red" : "amber";
  return <Badge tone={tone}>{sentiment}</Badge>;
};
