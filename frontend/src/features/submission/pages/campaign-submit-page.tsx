import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { HelpCircle, Megaphone, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { uploadToS3 } from "@/lib/upload";
import type { PublicCampaign } from "@/lib/api/types";
import { campaignsApi } from "@/features/campaigns/api";
import { SubmissionShell } from "../components/submission-shell";
import { SubmissionSuccess } from "../components/submission-success";
import { VideoInput, type SelectedVideo } from "../components/video-input";

type Phase = "loading" | "ready" | "uploading" | "submitting" | "done" | "error";

export const CampaignSubmitPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [form, setForm] = useState({ name: "", designation: "", email: "" });
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) return;
    campaignsApi
      .getPublic(slug)
      .then((data) => {
        setCampaign(data);
        setPhase("ready");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "This campaign is not available.");
        setPhase("error");
      });
  }, [slug]);

  const tooLong =
    campaign && video?.durationSeconds != null && video.durationSeconds > campaign.max_duration;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!slug || !video || !campaign || tooLong) return;
    setError(null);
    setPhase("uploading");
    setProgress(0);
    try {
      const { url, key, maxFileSizeBytes } = await campaignsApi.getPublicUploadUrl(
        slug,
        video.file.name,
        video.file.type,
      );
      if (maxFileSizeBytes && video.file.size > maxFileSizeBytes) {
        setError("This video is too large. Please choose a smaller file.");
        setPhase("ready");
        return;
      }
      await uploadToS3(url, video.file, video.file.type, setProgress);

      setPhase("submitting");
      await campaignsApi.submitPublic(slug, {
        s3Key: key,
        clientName: form.name.trim(),
        ...(form.designation.trim() ? { clientDesignation: form.designation.trim() } : {}),
        ...(form.email.trim() ? { clientEmail: form.email.trim() } : {}),
        duration: video.durationSeconds,
        mimeType: video.file.type,
        consent: true,
      });
      setPhase("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setPhase("ready");
    }
  };

  if (phase === "loading") {
    return (
      <SubmissionShell>
        <FullPageSpinner />
      </SubmissionShell>
    );
  }

  if (phase === "error") {
    return (
      <SubmissionShell>
        <EmptyState icon={ShieldAlert} title="This campaign isn't available" description={error ?? undefined} />
      </SubmissionShell>
    );
  }

  if (phase === "done") {
    return (
      <SubmissionShell>
        <SubmissionSuccess name={form.name.trim()} />
      </SubmissionShell>
    );
  }

  const busy = phase === "uploading" || phase === "submitting";
  const canSubmit = video && form.name.trim() && consent && !tooLong && !busy;

  return (
    <SubmissionShell>
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
          <Megaphone className="h-3.5 w-3.5" />
          {campaign?.title}
        </span>
        {campaign?.description && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600">{campaign.description}</p>
        )}
      </div>

      {campaign?.questions && campaign.questions.length > 0 && (
        <Card className="mb-6 border-brand-100 bg-brand-50/50">
          <CardContent className="py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-900">
              <HelpCircle className="h-4 w-4" /> Not sure what to say?
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-800/80">
              {campaign.questions.map((question, i) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-6">
          <form onSubmit={submit} className="space-y-6">
            {campaign?.allow_video ? (
              <>
                <VideoInput onChange={setVideo} disabled={busy} />
                {campaign && (
                  <p className="-mt-3 text-xs text-gray-400">
                    Max length: {Math.floor(campaign.max_duration / 60)} min {campaign.max_duration % 60}s
                  </p>
                )}
                {tooLong && (
                  <p className="text-sm text-amber-600">
                    This video is longer than the {campaign!.max_duration}s limit. Please trim it or record a shorter one.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">
                This campaign only accepts text submissions, which aren&apos;t supported in this form yet.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Your name *</Label>
                <Input id="name" required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sarah Kim" disabled={busy} />
              </div>
              <div>
                <Label htmlFor="designation">
                  Role / company <span className="font-normal text-gray-400">(optional)</span>
                </Label>
                <Input id="designation" maxLength={120} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="CEO, Acme Corp" disabled={busy} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">
                Your email <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input id="email" type="email" maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sarah@acme.com" disabled={busy} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-brand-100 bg-brand-50/50 p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={busy}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm leading-relaxed text-gray-700">
                I grant the business owner permission to publish and display this testimonial — including
                my name, role, and likeness — on their website and in their marketing materials. I
                understand I can request removal at any time by contacting{" "}
                <span className="font-medium">hello@tryvouch.me</span>.
              </span>
            </label>

            {busy && (
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                  <span>{phase === "uploading" ? "Uploading video…" : "Finishing up…"}</span>
                  <span>{phase === "uploading" ? `${Math.round(progress * 100)}%` : ""}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-300"
                    style={{ width: phase === "uploading" ? `${progress * 100}%` : "100%" }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit} loading={busy}>
              <Send className="h-4 w-4" />
              {phase === "uploading" ? "Uploading…" : phase === "submitting" ? "Submitting…" : "Submit testimonial"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </SubmissionShell>
  );
};
