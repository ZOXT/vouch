import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, LayoutGrid, List, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatDuration, initialsOf } from "@/lib/utils";
import { API_ORIGIN } from "@/lib/config";
import { ApiError } from "@/lib/api/client";
import type { EmbedLayout, EmbedTheme, TestimonialListItem } from "@/lib/api/types";
import { testimonialsApi } from "@/features/testimonials/api";
import { embedsApi, embedSnippet } from "../api";

const layouts: { value: EmbedLayout; label: string; icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Grid", icon: LayoutGrid },
  { value: "carousel", label: "Carousel", icon: LayoutGrid },
  { value: "list", label: "List", icon: List },
];

const themes: { value: EmbedTheme; label: string; description: string; swatch: string }[] = [
  {
    value: "minimal",
    label: "Minimal",
    description: "Crisp, airy, editorial whitespace",
    swatch: "from-white to-gray-100 border border-gray-200",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep slate with a glassy glow",
    swatch: "from-gray-900 to-gray-800",
  },
  {
    value: "gradient",
    label: "Gradient",
    description: "Bold, vibrant color tiles",
    swatch: "from-indigo-500 via-purple-500 to-pink-500",
  },
  {
    value: "editorial",
    label: "Editorial",
    description: "Quiet luxury, serif captions",
    swatch: "from-stone-100 to-stone-200 border border-gray-200",
  },
];

export const EmbedEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [layout, setLayout] = useState<EmbedLayout>("grid");
  const [theme, setTheme] = useState<EmbedTheme>("minimal");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [publicId, setPublicId] = useState<string | null>(null);

  const [testimonials, setTestimonials] = useState<TestimonialListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const previewTimer = useRef<number | null>(null);

  useEffect(() => {
    Promise.allSettled([
      testimonialsApi.list({ page: 1, limit: 100, status: "completed", isPublished: true }),
      ...(isEdit && id ? [embedsApi.get(id)] : []),
    ]).then(([testimonialsResult, embedResult]) => {
      if (testimonialsResult.status === "fulfilled") {
        setTestimonials(testimonialsResult.value.data);
      }
      if (embedResult && embedResult.status === "fulfilled") {
        const embed = embedResult.value;
        setTitle(embed.title ?? "");
        setLayout(embed.layout);
        setTheme(embed.theme);
        setCaptionsEnabled(embed.captions_enabled);
        setSelected(embed.testimonials.map((t) => t.testimonial.id));
        setAllowedDomains(embed.allowed_domains.join("\n"));
        setPublicId(embed.public_id);
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  // Live preview: re-render the iframe whenever any visual option changes,
  // without requiring a save. Works in both create and edit mode.
  const renderPreview = useCallback(async () => {
    if (selected.length === 0) {
      setPreviewHtml(null);
      return;
    }
    try {
      const result = await embedsApi.preview({
        title: title.trim(),
        displayStyle: layout,
        theme,
        testimonialIds: selected,
        captionsEnabled,
      });
      setPreviewHtml(result.html);
    } catch {
      setPreviewHtml((prev) => prev);
    }
  }, [title, layout, theme, selected, captionsEnabled]);

  useEffect(() => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => {
      void renderPreview();
    }, 250);
    return () => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
    };
  }, [renderPreview]);

  const toggleTestimonial = (testimonialId: string) => {
    setSelected((prev) =>
      prev.includes(testimonialId)
        ? prev.filter((t) => t !== testimonialId)
        : [...prev, testimonialId],
    );
  };

  const snippet = useMemo(
    () => (publicId ? embedSnippet(API_ORIGIN || window.location.origin, publicId) : null),
    [publicId],
  );

  const save = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Give your embed a title.");
      return;
    }
    if (selected.length === 0) {
      setError("Select at least one testimonial.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        const domains = allowedDomains
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean);
        const updated = await embedsApi.update(id, {
          title: title.trim(),
          displayStyle: layout,
          theme,
          testimonialIds: selected,
          captionsEnabled,
          allowedDomains: domains,
        });
        setPublicId(updated.public_id);
        toast.success("Embed updated");
      } else {
        const created = await embedsApi.create({
          title: title.trim(),
          displayStyle: layout,
          theme,
          testimonialIds: selected,
          captionsEnabled,
        });
        toast.success("Embed created");
        navigate(`/embeds/${created.id}`, { replace: true });
        return;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save embed";
      setError(message);
      if (err instanceof ApiError && err.status === 403) toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await embedsApi.remove(id);
      toast.success("Embed deleted");
      navigate("/embeds");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete embed");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <Skeleton className="h-[32rem] w-full" />;

  return (
    <div>
      <div className="mb-4">
        <Link to="/embeds" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Embeds
        </Link>
      </div>
      <PageHeader
        title={isEdit ? "Edit embed" : "New embed"}
        description="Choose testimonials, configure the look, and paste the snippet on your site."
        actions={
          isEdit ? (
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Delete this embed?</DialogTitle>
                <DialogDescription>It will stop rendering on every site using the snippet.</DialogDescription>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                  <Button variant="danger" loading={deleting} onClick={remove}>Delete</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="embed-title">Title *</Label>
                <Input id="embed-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Homepage wall" />
              </div>

              <div>
                <Label>Layout</Label>
                <div className="grid grid-cols-3 gap-2">
                  {layouts.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLayout(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-sm font-medium transition-colors",
                        layout === value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                      )}
                      aria-pressed={layout === value}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {themes.map(({ value, label, description, swatch }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-2.5 text-left transition-colors",
                        theme === value
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                      )}
                      aria-pressed={theme === value}
                    >
                      <span className={cn("h-9 w-full rounded-lg bg-gradient-to-br", swatch)} />
                      <span className="w-full">
                        <span className="block text-xs font-semibold text-gray-900">{label}</span>
                        <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">{description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Captions</p>
                  <p className="text-xs text-gray-500">Show a CC toggle in the embed player</p>
                </div>
                <Switch checked={captionsEnabled} onCheckedChange={setCaptionsEnabled} />
              </div>

              {isEdit && (
                <div>
                  <Label htmlFor="domains">Allowed domains</Label>
                  <textarea
                    id="domains"
                    rows={3}
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder={"yourdomain.com\n*.client-site.com"}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <FieldHint>One per line. Leave empty to allow embedding anywhere. Wildcards like *.example.com work.</FieldHint>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testimonials</CardTitle>
              <CardDescription>
                {selected.length} selected · only published, ready videos can be embedded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testimonials && testimonials.length > 0 ? (
                <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto scrollbar-subtle sm:grid-cols-3">
                  {testimonials.map((testimonial) => {
                    const isSelected = selected.includes(testimonial.id);
                    return (
                      <button
                        key={testimonial.id}
                        type="button"
                        onClick={() => toggleTestimonial(testimonial.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "relative overflow-hidden rounded-lg border-2 text-left transition-all",
                          isSelected ? "border-brand-500 ring-2 ring-brand-500/30" : "border-transparent hover:border-gray-300",
                        )}
                      >
                        <div className="relative aspect-video bg-gradient-to-br from-brand-500 to-indigo-500">
                          {testimonial.thumbnail_url ? (
                            <img src={testimonial.thumbnail_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white/40">
                              {initialsOf(testimonial.client_name)}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          {testimonial.duration_seconds != null && (
                            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              {formatDuration(testimonial.duration_seconds)}
                            </span>
                          )}
                        </div>
                        <p className="truncate bg-white px-2 py-1.5 text-xs font-medium text-gray-700">
                          {testimonial.client_name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  No published, ready testimonials yet.{" "}
                  <Link to="/testimonials" className="font-medium text-brand-600 hover:text-brand-700">
                    Publish one first
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>

          {error && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {error}
            </p>
          )}

          <Button onClick={save} loading={saving} size="lg" className="w-full">
            {isEdit ? "Save changes" : "Create embed"}
          </Button>
        </div>

        <div className="space-y-6">
          {snippet && (
            <Card>
              <CardHeader>
                <CardTitle>Embed snippet</CardTitle>
                <CardDescription>Paste these two lines into your website.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <pre className="overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs leading-relaxed text-gray-100">
                  <code>{snippet}</code>
                </pre>
                <CopyButton value={snippet} label="Copy snippet" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>
                {selected.length === 0
                  ? "Select at least one testimonial to preview."
                  : "Updates live as you change options. No save needed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Embed preview"
                  className="h-96 w-full rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <div className="flex h-96 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                  Preview will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
