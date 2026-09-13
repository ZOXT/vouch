import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Clock, HelpCircle, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Input, Label } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { uploadToS3 } from "@/lib/upload";
import { MAX_TESTIMONIAL_DURATION_SECONDS } from "@/lib/limits";
import type { PublicTestimonialRequest } from "@/lib/api/types";
import { requestsApi } from "@/features/requests/api";
import { SubmissionShell } from "../components/submission-shell";
import { SubmissionSuccess } from "../components/submission-success";
import { VideoInput, type SelectedVideo } from "../components/video-input";

type Phase = "loading" | "ready" | "uploading" | "submitting" | "done" | "error";

export const RequestSubmitPage = () => {
  const { token } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [info, setInfo] = useState<PublicTestimonialRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [designation, setDesignation] = useState("");
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!token) return;
    requestsApi
      .getPublic(token)
      .then((data) => {
        setInfo(data);
        setPhase("ready");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "This link is not valid.");
        setPhase("error");
      });
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !video) return;
    if (
      video.durationSeconds != null &&
      video.durationSeconds > MAX_TESTIMONIAL_DURATION_SECONDS
    ) {
      setError("Videos can be up to 2 minutes long. Please record a shorter video.");
      return;
    }
    setError(null);
    setPhase("uploading");
    setProgress(0);
    try {
      const { url, key } = await requestsApi.getUploadUrl(token, video.file.name, video.file.type);
      await uploadToS3(url, video.file, video.file.type, setProgress);

      setPhase("submitting");
      await requestsApi.confirmUpload({
        token,
        key,
        duration: video.durationSeconds,
        mimeType: video.file.type,
        consent: true,
        ...(designation.trim() ? { clientDesignation: designation.trim() } : {}),
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
        <EmptyState icon={ShieldAlert} title="This link isn't available" description={error ?? undefined} />
      </SubmissionShell>
    );
  }

  if (phase === "done") {
    return (
      <SubmissionShell logoUrl={info?.logoUrl} companyName={info?.companyName} companyUrl={info?.companyUrl}>
        <SubmissionSuccess name={info?.clientName} />
      </SubmissionShell>
    );
  }

  const busy = phase === "uploading" || phase === "submitting";

  return (
    <SubmissionShell logoUrl={info?.logoUrl} companyName={info?.companyName} companyUrl={info?.companyUrl}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
          {info?.title ?? `Hi ${info?.clientName ?? "there"}, share your experience`}
        </h1>
        {info?.message && <p className="mt-3 text-sm leading-relaxed text-gray-600">{info.message}</p>}
        {info?.expiresAt && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            Link valid until {new Date(info.expiresAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {info?.questions && info.questions.length > 0 && (
        <Card className="mb-6 border-brand-100 bg-brand-50/50">
          <CardContent className="py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-900">
              <HelpCircle className="h-4 w-4" /> Not sure what to say?
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-brand-800/80">
              {info.questions.map((question, i) => (
                <li key={i}>{question}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-6">
          <form onSubmit={submit} className="space-y-6">
            <VideoInput onChange={setVideo} disabled={busy} />

            <div>
              <Label htmlFor="designation">
                Your role / company <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <Input
                id="designation"
                maxLength={120}
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="CEO, Acme Corp"
                disabled={busy}
              />
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
                I grant <span className="font-medium">{info?.companyName ?? "the business owner"}</span> permission
                to publish and display this testimonial — including my name, role, and likeness — on their
                website and in their marketing materials. I understand I can request removal at any time by
                contacting <span className="font-medium">hello@tryvouch.me</span>.
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

            <Button type="submit" size="lg" className="w-full" disabled={!video || !consent || busy} loading={busy}>
              <Send className="h-4 w-4" />
              {phase === "uploading" ? "Uploading…" : phase === "submitting" ? "Submitting…" : "Submit testimonial"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </SubmissionShell>
  );
};
