import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

const LAST_UPDATED = "September 7, 2026";

export const PrivacyPage = () => (
  <div className="min-h-screen bg-white">
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Quote className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-gray-900">Vouch</span>
        </Link>
      </div>
    </nav>

    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-gray-700">
        <Section id="introduction" title="1. Introduction">
          <p>
            Vouch ("we", "us", "our") is a testimonial collection and management platform operated from
            tryvouch.me. This Privacy Policy explains what personal data we collect, how we use it,
            and the choices you have — whether you are a registered account holder ("Owner") or someone
            who submits a testimonial through a Vouch-powered form or campaign ("Submitter").
          </p>
          <p>
            By using Vouch you agree to the practices described here. If you do not agree, please do
            not use the platform. We may update this policy from time to time; material changes will be
            announced on our website or by email.
          </p>
        </Section>

        <Section id="data-collected" title="2. Data we collect">
          <p>We collect different categories of data depending on how you interact with Vouch.</p>

          <h3 className="text-lg font-semibold text-gray-900">2.1 Account data (Owners)</h3>
          <p>
            When an Owner creates an account we collect a name, email address, hashed password, role
            (freelancer or agency), optional company name and URL, and an optional profile avatar.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2.2 Testimonial data (Submitters)</h3>
          <p>
            When a Submitter provides a testimonial we collect a name, an optional email address, an
            optional role / company designation, the video or audio file, and any text you enter in the
            submission form. We also record whether you consented to the testimonial being published.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2.3 Derived data</h3>
          <p>
            After a video is uploaded, our system automatically generates a transcript, optional
            captions, a sentiment label, a brief AI analysis (industry, pain points, outcomes,
            objections, keywords), and a confidence score. This derived data is produced from the
            content you provide and is stored alongside the original recording.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2.4 Payment data</h3>
          <p>
            If an Owner subscribes to a paid plan, payment is processed by{" "}
            <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
              Paddle
            </a>
            . We do not store credit-card numbers, bank details, or other financial credentials on
            our servers. Paddle provides us with a customer ID, subscription status, plan, and billing
            period — data necessary to manage your subscription.
          </p>

          <h3 className="text-lg font-semibold text-gray-900">2.5 Usage data</h3>
          <p>
            We store basic server-side logs (IP address, browser user-agent, request timestamps) for
            security, fraud prevention, and operational monitoring. We do not currently deploy
            third-party analytics or advertising trackers on the platform.
          </p>
        </Section>

        <Section id="how-data-is-used" title="3. How we use your data">
          <ul className="list-disc space-y-2 pl-5">
            <li>To provide, operate, and improve the Vouch platform.</li>
            <li>To process uploaded videos — including AI-powered transcription, captioning, sentiment
              analysis, and indexing — and make them available to the account Owner who requested the
              testimonial.</li>
            <li>To send transactional email notifications (for example, OTP verification, account
              alerts, and testimonial-received confirmations).</li>
            <li>To manage billing, invoicing, and subscription renewals via Paddle.</li>
            <li>To detect, prevent, and investigate security incidents or abuse.</li>
            <li>To comply with legal obligations when applicable.</li>
          </ul>
          <p>
            We do not sell your personal data to third parties, and we do not use it for
            interest-based advertising.
          </p>
        </Section>

        <Section id="legal-basis" title="4. Legal basis (EEA / UK)">
          <p>
            For users in the European Economic Area or the United Kingdom, we process personal data
            under the following legal bases:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Consent</span> — Submitters explicitly consent to the
              publication of their testimonial by checking the consent checkbox at submission. Owners
              consent to processing when they create an account.
            </li>
            <li>
              <span className="font-medium">Contract</span> — processing is necessary to provide the
              Vouch service you signed up for.
            </li>
            <li>
              <span className="font-medium">Legitimate interest</span> — for platform security,
              fraud prevention, and operational monitoring, where these interests are not overridden
              by your rights.
            </li>
            <li>
              <span className="font-medium">Legal obligation</span> — where we are required by law
              to retain or disclose information.
            </li>
          </ul>
        </Section>

        <Section id="sharing" title="5. Sharing and third-party processors">
          <p>
            We share data only with service providers who process it on our behalf under written
            agreements that restrict how they may use it:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">AWS S3 and CloudFront</span> — video, audio, thumbnail,
              and caption file storage and content delivery.
            </li>
            <li>
              <span className="font-medium">Supabase</span> — PostgreSQL database hosting.
            </li>
            <li>
              <span className="font-medium">Paddle</span> — payment processing and subscription
              management.
            </li>
            <li>
              <span className="font-medium">Groq</span> — AI-powered transcription and testimonial
              analysis. Video/audio content is transmitted to Groq solely for generating the
              transcript and analysis; Groq does not retain it beyond the processing call.
            </li>
            <li>
              <span className="font-medium">Redis</span> — job queue processing for background
              media tasks.
            </li>
            <li>
              <span className="font-medium">Resend</span> — transactional email delivery.
            </li>
          </ul>
          <p>
            All of these providers are located in the United States. We rely on Standard Contractual
            Clauses or equivalent safeguards where required by applicable data-protection law.
          </p>
          <p>
            We may disclose data if required to do so by law, or in good-faith belief that such
            action is necessary to comply with a legal obligation, protect our rights, or ensure the
            safety of our users or the public.
          </p>
        </Section>

        <Section id="retention" title="6. Data retention">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Account data</span> — retained while the account is
              active. Upon account deletion, personal data is removed within 30 days except where we
              are legally required to retain it longer.
            </li>
            <li>
              <span className="font-medium">Testimonials</span> — retained until the account Owner
              deletes them. Submitters may request removal by contacting{" "}
              <a href="mailto:hello@tryvouch.me" className="text-brand-600 hover:text-brand-700">
                hello@tryvouch.me
              </a>
              .
            </li>
            <li>
              <span className="font-medium">Server logs</span> — rotated and purged on a rolling
              90-day cycle.
            </li>
            <li>
              <span className="font-medium">Payment records</span> — retained for 7 years as
              required for tax and accounting purposes (handled by Paddle).
            </li>
          </ul>
        </Section>

        <Section id="cookies" title="7. Cookies and local storage">
          <p>
            Vouch uses two httpOnly authentication cookies (an access token and a refresh token) to
            keep you signed in. These are strictly necessary for the platform to function and are not
            used for tracking or analytics.
          </p>
          <p>
            The embedded testimonial player may use a single localStorage entry to record playback
            preferences. No third-party cookies are set.
          </p>
        </Section>

        <Section id="your-rights" title="8. Your rights">
          <p>
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Restrict or object to certain processing.</li>
            <li>Data portability — receive your data in a structured, machine-readable format.</li>
            <li>Withdraw consent at any time (this does not affect processing that already took place).</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:hello@tryvouch.me" className="text-brand-600 hover:text-brand-700">
              hello@tryvouch.me
            </a>
            . We will respond within 30 days.
          </p>
          <p>
            If you are in the EEA and believe we have not handled your request adequately, you have
            the right to lodge a complaint with your local data-protection supervisory authority.
          </p>
        </Section>

        <Section id="children" title="9. Children's privacy">
          <p>
            Vouch is not intended for use by anyone under the age of 16 (or the applicable age of
            digital consent in your jurisdiction). We do not knowingly collect data from children. If
            you are a parent or guardian and believe a child has submitted personal data through Vouch,
            please contact us and we will delete it.
          </p>
        </Section>

        <Section id="international" title="10. International data transfers">
          <p>
            Vouch is operated from the United States. If you are outside the US, your data will be
            transferred to and processed in the United States. We ensure appropriate safeguards are in
            place, including Standard Contractual Clauses where required by law.
          </p>
        </Section>

        <Section id="changes" title="11. Changes to this policy">
          <p>
            We may update this Privacy Policy to reflect changes in our practices or legal
            requirements. When we make material changes, we will update the "Last updated" date at the
            top of this page and, where appropriate, notify you by email or a prominent notice on our
            website.
          </p>
        </Section>

        <Section id="contact" title="12. Contact us">
          <p>
            If you have any questions about this Privacy Policy or wish to exercise any of your
            rights, please contact us at:
          </p>
          <p>
            <strong>Vouch</strong><br />
            Email:{" "}
            <a href="mailto:hello@tryvouch.me" className="text-brand-600 hover:text-brand-700">
              hello@tryvouch.me
            </a>
            <br />
            Website:{" "}
            <a href="https://tryvouch.me" className="text-brand-600 hover:text-brand-700">
              tryvouch.me
            </a>
          </p>
        </Section>
      </div>
    </main>

    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-8 text-sm text-gray-500 sm:px-6">
        <p>&copy; {new Date().getFullYear()} Vouch. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-500 transition-colors hover:text-gray-900">
            Home
          </Link>
          <Link to="/pricing" className="text-gray-500 transition-colors hover:text-gray-900">
            Pricing
          </Link>
          <Link to="/terms" className="text-gray-500 transition-colors hover:text-gray-900">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  </div>
);

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
