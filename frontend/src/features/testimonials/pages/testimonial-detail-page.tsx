import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Globe, GlobeLock, FileText, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge, SentimentBadge } from "@/components/status-badge";
import { formatDate, formatDuration } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { TestimonialDetail } from "@/lib/api/types";
import { testimonialsApi } from "../api";
import { CaptionOverlay } from "../components/caption-overlay";

const PROCESSING = ["pending", "media_processing", "transcribing", "ai_processing"];

const TagList = ({ label, items }: { label: string; items?: string[] }) =>
  (items?.length ?? 0) > 0 ? (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(items ?? []).map((item) => (
          <Badge key={item} tone="gray">{item}</Badge>
        ))}
      </div>
    </div>
  ) : null;

export const TestimonialDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testimonial, setTestimonial] = useState<TestimonialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    testimonialsApi
      .get(id)
      .then((data) => {
        if (!cancelled) setTestimonial(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load testimonial");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Re-poll while the video is still being processed
  useEffect(() => {
    if (!id || !testimonial || !PROCESSING.includes(testimonial.status)) return;
    const timer = setTimeout(() => {
      testimonialsApi.get(id).then(setTestimonial).catch(() => {});
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, testimonial]);

  const togglePublish = async () => {
    if (!testimonial || toggling) return;
    setToggling(true);
    try {
      const result = await testimonialsApi.togglePublish(testimonial.id);
      setTestimonial({ ...testimonial, is_published: result.isPublished, published_at: result.publishedAt });
      toast.success(result.isPublished ? "Testimonial published" : "Testimonial unpublished");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update publish state");
    } finally {
      setToggling(false);
    }
  };

  const remove = async () => {
    if (!testimonial) return;
    setDeleting(true);
    try {
      await testimonialsApi.remove(testimonial.id);
      toast.success("Testimonial deleted");
      navigate("/testimonials");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete testimonial");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="aspect-video w-full lg:col-span-3" />
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !testimonial) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this testimonial"
        description={error ?? "It may have been deleted."}
        action={<Link to="/testimonials"><Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back to testimonials</Button></Link>}
      />
    );
  }

  const ready = testimonial.status === "completed";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/testimonials" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Testimonials
        </Link>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            {testimonial.is_published ? <Globe className="h-4 w-4 text-emerald-600" /> : <GlobeLock className="h-4 w-4 text-gray-400" />}
            {testimonial.is_published ? "Published" : "Unpublished"}
            <Switch checked={testimonial.is_published} onCheckedChange={togglePublish} disabled={toggling || !ready} aria-label="Toggle published" />
          </label>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Delete this testimonial?</DialogTitle>
              <DialogDescription>
                The video from {testimonial.client_name} will be removed. This action can&apos;t be undone.
              </DialogDescription>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="danger" loading={deleting} onClick={remove}>Delete</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-black shadow-card">
            {ready && testimonial.video_url ? (
              <>
                <video
                  ref={videoRef}
                  src={testimonial.video_url}
                  controls
                  playsInline
                  className="aspect-video w-full"
                  poster={testimonial.thumbnail_url ?? undefined}
                />
                {testimonial.captions_key && (
                  <CaptionOverlay
                    src={`/api/v1/testimonials/${testimonial.id}/captions`}
                    videoRef={videoRef}
                  />
                )}
              </>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 text-gray-400">
                {testimonial.status === "failed" ? (
                  <>
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                    <p className="max-w-sm text-center text-sm">{testimonial.failure_reason ?? "Processing failed."}</p>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-brand-400" />
                    <p className="text-sm">Processing video, this takes a minute…</p>
                  </>
                )}
              </div>
            )}
          </div>

          {testimonial.summary && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <CardTitle>AI summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-gray-700">{testimonial.summary}</p>
              </CardContent>
            </Card>
          )}

          {testimonial.transcript && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="max-h-72 overflow-y-auto text-sm leading-relaxed text-gray-600 scrollbar-subtle">
                  {testimonial.transcript}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{testimonial.client_name}</p>
                  {testimonial.client_designation && (
                    <p className="text-xs text-gray-500">{testimonial.client_designation}</p>
                  )}
                  {testimonial.client_email && (
                    <p className="mt-0.5 text-xs text-gray-400">{testimonial.client_email}</p>
                  )}
                </div>
                <StatusBadge status={testimonial.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Duration</dt>
                  <dd className="mt-0.5 font-medium">{formatDuration(testimonial.duration_seconds)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Received</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(testimonial.created_at)}</dd>
                </div>
                {testimonial.sentiment && (
                  <div>
                    <dt className="text-xs text-gray-400">Sentiment</dt>
                    <dd className="mt-1"><SentimentBadge sentiment={testimonial.sentiment} /></dd>
                  </div>
                )}
                {testimonial.confidence_score != null && (
                  <div>
                    <dt className="text-xs text-gray-400">AI confidence</dt>
                    <dd className="mt-0.5 font-medium">{Math.round(testimonial.confidence_score * 100)}%</dd>
                  </div>
                )}
                {testimonial.language && (
                  <div>
                    <dt className="text-xs text-gray-400">Language</dt>
                    <dd className="mt-0.5 font-medium uppercase">{testimonial.language}</dd>
                  </div>
                )}
                {testimonial.industry && (
                  <div>
                    <dt className="text-xs text-gray-400">Industry</dt>
                    <dd className="mt-0.5 font-medium">{testimonial.industry}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {((testimonial.outcomes?.length ?? 0) > 0 ||
            (testimonial.pain_points?.length ?? 0) > 0 ||
            (testimonial.keywords?.length ?? 0) > 0 ||
            (testimonial.objections?.length ?? 0) > 0) && (
            <Card>
              <CardHeader><CardTitle>AI insights</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <TagList label="Outcomes" items={testimonial.outcomes} />
                <TagList label="Pain points" items={testimonial.pain_points} />
                <TagList label="Objections" items={testimonial.objections} />
                <TagList label="Keywords" items={testimonial.keywords} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
