import { useEffect, useState, type FormEvent } from "react";
import { Clock, Link2, MailCheck, Send, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { ApiError, apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type { TestimonialRequest } from "@/lib/api/types";
import { requestsApi, type TestimonialRequestWithUrl } from "../api";

interface Created {
  request: TestimonialRequest;
  url: string;
  emailed: boolean;
}

export const RequestsPage = () => {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    title: "",
    message: "",
    questions: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [history, setHistory] = useState<TestimonialRequestWithUrl[] | null>(null);

  const loadHistory = () => {
    requestsApi.list().then(setHistory).catch(() => setHistory([]));
  };

  useEffect(loadHistory, []);

  const handleResend = async (requestId: string) => {
    try {
      await apiFetch(`/testimonial-requests/${requestId}/resend`, { method: "POST" });
      toast.success("Invite email resent");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not resend email";
      toast.error(message);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const questions = form.questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);
      const clientEmail = form.clientEmail.trim();

      const result = await requestsApi.create({
        clientName: form.clientName.trim(),
        ...(clientEmail ? { clientEmail } : {}),
        ...(form.title.trim() ? { title: form.title.trim() } : {}),
        ...(form.message.trim() ? { message: form.message.trim() } : {}),
        ...(questions.length > 0 ? { questions } : {}),
      });

      setCreated({ ...result, emailed: Boolean(clientEmail) });
      setForm({ clientName: "", clientEmail: "", title: "", message: "", questions: "" });
      toast.success(clientEmail ? "Request created, invite email sent" : "Request created");
      loadHistory();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create request";
      setError(message);
      if (err instanceof ApiError && err.status === 403) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Request a testimonial"
        description="Create a one-time link for a specific client. They'll record right in their browser, no account needed."
      />

      <Card>
        <CardHeader>
          <CardTitle>New request</CardTitle>
          <CardDescription>
            Add the client&apos;s email and we&apos;ll send the invite for you, or copy the link and share it yourself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="clientName">Client name *</Label>
                <Input id="clientName" required maxLength={200} value={form.clientName} onChange={set("clientName")} placeholder="Sarah Kim" />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client email</Label>
                <Input id="clientEmail" type="email" maxLength={320} value={form.clientEmail} onChange={set("clientEmail")} placeholder="sarah@acme.com" />
                <FieldHint>We&apos;ll email the request if provided.</FieldHint>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Request title</Label>
              <Input id="title" maxLength={200} value={form.title} onChange={set("title")} placeholder="A quick testimonial for Acme" />
            </div>
            <div>
              <Label htmlFor="message">Personal message</Label>
              <Textarea id="message" maxLength={2000} value={form.message} onChange={set("message")} placeholder="Hey Sarah, would you mind sharing a 60-second video about your experience?" />
            </div>
            <div>
              <Label htmlFor="questions">Guiding questions</Label>
              <Textarea id="questions" value={form.questions} onChange={set("questions")} placeholder={"What problem were you trying to solve?\nWhat results did you see?"} />
              <FieldHint>One question per line, shown to the client while they record.</FieldHint>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                <Send className="h-4 w-4" />
                Create request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {created && (
        <Card className="mt-6 animate-slide-up border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                {created.emailed ? <MailCheck className="h-5 w-5 text-emerald-600" /> : <Link2 className="h-5 w-5 text-emerald-600" />}
              </span>
              <div>
                <CardTitle>Request ready for {created.request.client_name}</CardTitle>
                <CardDescription>
                  {created.emailed
                    ? "The invite email is on its way. You can also share the link directly."
                    : "Share this link with your client. It expires in 7 days."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <code className="flex-1 truncate rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700">
                {created.url}
              </code>
              <CopyButton value={created.url} label="Copy link" />
            </div>
          </CardContent>
        </Card>
      )}

      {history === null ? (
        <div className="mt-10">
          <RowsSkeleton count={3} />
        </div>
      ) : history.length > 0 ? (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent requests</h2>
          <Card>
            <ul className="divide-y divide-gray-100">
              {history.map((request) => (
                <li key={request.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                    {request.client_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{request.client_name}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      {request.client_email && <span className="truncate">{request.client_email}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {request.status === "completed"
                          ? `Completed ${formatDate(request.completed_at)}`
                          : request.status === "expired"
                            ? "Expired"
                            : `Expires ${formatDate(request.expires_at)}`}
                      </span>
                    </p>
                  </div>
                  <Badge
                    tone={request.status === "completed" ? "green" : request.status === "expired" ? "gray" : "amber"}
                  >
                    {request.status}
                  </Badge>
                  {request.status === "pending" && (
                    <div className="flex items-center gap-2">
                      {request.client_email && (
                        <button
                          type="button"
                          onClick={() => handleResend(request.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                        >
                          <RotateCw className="h-3 w-3" />
                          Resend
                        </button>
                      )}
                      <CopyButton value={request.url} label="Copy link" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
};
