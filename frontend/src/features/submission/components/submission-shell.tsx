import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/avatar";

/** Minimal branded frame for the public (client-facing) submission pages. */
export const SubmissionShell = ({
  children,
  logoUrl,
  companyName,
  companyUrl,
}: {
  children: ReactNode;
  logoUrl?: string | null;
  companyName?: string | null;
  companyUrl?: string | null;
}) => (
  <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-gray-50 to-gray-50">
    <header className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 pt-10">
      <Avatar
        src={logoUrl}
        name={companyName || "V"}
        className="h-10 w-10 rounded-full bg-brand-600 text-sm font-semibold text-white shadow ring-2 ring-white"
      />
      {companyName && (
        <p className="mt-2 text-sm font-medium text-gray-700">
          {companyUrl ? <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">{companyName}</a> : companyName}
        </p>
      )}
    </header>
    <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    <footer className="pb-10 text-center text-xs text-gray-400">
      Powered by <span className="font-semibold text-brand-600">Vouch</span> · tryvouch.me ·{" "}
      <Link to="/privacy" className="underline transition-colors hover:text-gray-500">
        Privacy Policy
      </Link>{" "}
      ·{" "}
      <Link to="/terms" className="underline transition-colors hover:text-gray-500">
        Terms of Service
      </Link>
    </footer>
  </div>
);
