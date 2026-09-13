import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/input";
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
import { ApiError } from "@/lib/api/client";
import { MAX_TESTIMONIAL_DURATION_SECONDS } from "@/lib/limits";
import { campaignsApi, type CampaignInput } from "../api";

const emptyForm = {
  title: "",
  description: "",
  questions: "",
  allowVideo: true,
  allowText: false,
  maxDuration: 120,
  isActive: true,
};

export const CampaignFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(isEdit);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    campaignsApi
      .get(id)
      .then((campaign) => {
        setForm({
          title: campaign.title,
          description: campaign.description ?? "",
          questions: (campaign.questions ?? []).join("\n"),
          allowVideo: campaign.allow_video,
          allowText: campaign.allow_text,
          maxDuration: campaign.max_duration,
          isActive: campaign.is_active,
        });
        setUrl(campaign.url);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load campaign");
      })
      .finally(() => setLoadingCampaign(false));
  }, [id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const questions = form.questions
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const payload: CampaignInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      questions: questions.length > 0 ? questions : null,
      allowVideo: form.allowVideo,
      allowText: form.allowText,
      maxDuration: form.maxDuration,
    };

    try {
      if (isEdit && id) {
        const updated = await campaignsApi.update(id, { ...payload, isActive: form.isActive });
        setUrl(updated.url);
        toast.success("Campaign updated");
        navigate("/campaigns");
      } else {
        const created = await campaignsApi.create(payload);
        toast.success("Campaign created");
        navigate(`/campaigns/${created.id}`, { replace: true });
        return;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save campaign";
      setError(message);
      if (err instanceof ApiError && err.status === 403) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await campaignsApi.remove(id);
      toast.success("Campaign deleted");
      navigate("/campaigns");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete campaign");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loadingCampaign) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Campaigns
        </Link>
      </div>
      <PageHeader
        title={isEdit ? "Edit campaign" : "New campaign"}
        description={isEdit ? "Update your campaign settings." : "One public link, unlimited client testimonials."}
        actions={
          isEdit ? (
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Delete this campaign?</DialogTitle>
                <DialogDescription>
                  The public link will stop working. Testimonials already collected are kept.
                </DialogDescription>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                  <Button variant="danger" loading={deleting} onClick={remove}>Delete</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      {url && (
        <Card className="mb-6 border-brand-200 bg-brand-50/40">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700">
              {url}
            </code>
            <CopyButton value={url} label="Copy public link" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Campaign settings</CardTitle>
          <CardDescription>What clients see when they open your link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Customer stories for Acme" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" maxLength={5000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell clients what you're looking for…" />
            </div>
            <div>
              <Label htmlFor="questions">Guiding questions</Label>
              <Textarea id="questions" value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} placeholder={"What problem were you trying to solve?\nWhat results did you see?"} />
              <FieldHint>One per line, up to 10.</FieldHint>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Video submissions</p>
                  <p className="text-xs text-gray-500">Clients can record/upload video</p>
                </div>
                <Switch checked={form.allowVideo} onCheckedChange={(v) => setForm({ ...form, allowVideo: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Text submissions</p>
                  <p className="text-xs text-gray-500">Clients can write instead</p>
                </div>
                <Switch checked={form.allowText} onCheckedChange={(v) => setForm({ ...form, allowText: v })} />
              </div>
            </div>
            {!form.allowVideo && !form.allowText && (
              <p className="text-sm text-amber-600">Enable at least one submission type.</p>
            )}

            <div>
              <Label htmlFor="maxDuration">Max video length (seconds)</Label>
              <Input
                id="maxDuration"
                type="number"
                min={1}
                max={MAX_TESTIMONIAL_DURATION_SECONDS}
                required
                value={form.maxDuration}
                onChange={(e) => setForm({ ...form, maxDuration: Number(e.target.value) })}
              />
              <FieldHint>Up to {MAX_TESTIMONIAL_DURATION_SECONDS} seconds (2 minutes). 120s is the maximum.</FieldHint>
            </div>

            {isEdit && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Campaign active</p>
                  <p className="text-xs text-gray-500">Paused campaigns show as closed to clients</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={loading} disabled={!form.allowVideo && !form.allowText}>
                {isEdit ? "Save changes" : "Create campaign"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
