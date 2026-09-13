import { Link } from "react-router-dom";
import { Play, Clock } from "lucide-react";
import { cn, formatDate, formatDuration, initialsOf } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { CopyButton } from "@/components/copy-button";
import type { TestimonialListItem } from "@/lib/api/types";

const PROCESSING: TestimonialListItem["status"][] = ["pending", "media_processing", "transcribing", "ai_processing"];

export const TestimonialCard = ({ testimonial }: { testimonial: TestimonialListItem }) => {
  const processing = PROCESSING.includes(testimonial.status);

  return (
    <Link
      to={`/testimonials/${testimonial.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500">
        {testimonial.thumbnail_url ? (
          <img
            src={testimonial.thumbnail_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white/25">
            {initialsOf(testimonial.client_name)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {testimonial.status === "completed" && (
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-transform group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        )}

        {processing && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            Processing…
          </span>
        )}

        {testimonial.duration_seconds != null && (
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            <Clock className="h-3 w-3" />
            {formatDuration(testimonial.duration_seconds)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{testimonial.client_name}</p>
            {testimonial.client_designation && (
              <p className="mt-0.5 truncate text-xs text-gray-500">{testimonial.client_designation}</p>
            )}
          </div>
          <StatusBadge status={testimonial.status} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(testimonial.created_at)}</span>
          <span
            className={cn(
              "font-medium",
              testimonial.is_published ? "text-emerald-600" : "text-gray-400",
            )}
          >
            {testimonial.is_published ? "Published" : "Unpublished"}
          </span>
        </div>
        {testimonial.status === "completed" && testimonial.video_url && (
          <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <CopyButton
                value={testimonial.video_url}
                label="Share video"
                copiedLabel="Link copied"
                size="sm"
                className="text-xs"
              />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
