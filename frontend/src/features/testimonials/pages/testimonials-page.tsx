import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { GridSkeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/pagination";
import { ApiError } from "@/lib/api/client";
import type { TestimonialListResult, TestimonialStatus } from "@/lib/api/types";
import { testimonialsApi } from "../api";
import { TestimonialCard } from "../components/testimonial-card";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Ready" },
  { value: "pending", label: "Pending" },
  { value: "media_processing", label: "Processing" },
  { value: "transcribing", label: "Transcribing" },
  { value: "ai_processing", label: "Analyzing" },
  { value: "failed", label: "Failed" },
];

export const TestimonialsPage = () => {
  const [result, setResult] = useState<TestimonialListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<TestimonialStatus | "">("");
  const [published, setPublished] = useState<"all" | "published" | "unpublished">("all");
  const [sort, setSort] = useState("created_at:desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const [sortBy, sortOrder] = sort.split(":") as [string, "asc" | "desc"];
    testimonialsApi
      .list({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        status: status || undefined,
        isPublished: published === "all" ? undefined : published === "published",
        sortBy,
        sortOrder,
      })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Failed to load testimonials";
        setError(message);
        if (err instanceof ApiError && err.status === 403) toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, published, sort]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, published, sort]);

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Everything your clients have recorded, in one place."
        actions={
          <Button onClick={() => document.getElementById("testimonial-search")?.focus()} variant="outline">
            <Search className="h-4 w-4" />
            Search
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="testimonial-search"
            className="pl-9"
            placeholder="Search by name, industry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value as TestimonialStatus | "")} className="w-40">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Select value={published} onChange={(e) => setPublished(e.target.value as typeof published)} className="w-40">
          <option value="all">Published + not</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="client_name:asc">Name A–Z</option>
          <option value="client_name:desc">Name Z–A</option>
          <option value="duration_seconds:desc">Longest first</option>
        </Select>
      </div>

      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <EmptyState
          icon={Video}
          title="Couldn't load testimonials"
          description={error}
          action={<Button onClick={() => setPage((p) => p)}>Retry</Button>}
        />
      ) : result && result.data.length === 0 ? (
        <EmptyState
          icon={Video}
          title={debouncedSearch || status || published !== "all" ? "No testimonials match" : "No testimonials yet"}
          description={
            debouncedSearch || status || published !== "all"
              ? "Try adjusting your search or filters."
              : "Send your first testimonial request and the videos will show up here."
          }
          action={
            !debouncedSearch && !status && published === "all" ? (
              <Link to="/requests">
                <Button>Create a request</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result?.data.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
          {result && (
            <PaginationControls pagination={result.pagination} onPageChange={setPage} />
          )}
        </>
      )}

    </div>
  );
};
