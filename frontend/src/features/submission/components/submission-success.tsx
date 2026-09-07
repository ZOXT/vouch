import { CheckCircle2 } from "lucide-react";

export const SubmissionSuccess = ({ name }: { name?: string }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-card animate-slide-up">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
      <CheckCircle2 className="h-7 w-7 text-emerald-500" />
    </span>
    <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
      Thank you{name ? `, ${name}` : ""}!
    </h1>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
      Your testimonial was submitted successfully and is being processed.
      No further action is needed. You can close this page.
    </p>
  </div>
);
