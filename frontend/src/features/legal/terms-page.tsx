import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

const LAST_UPDATED = "September 13, 2026";

export const TermsPage = () => (
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
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-gray-700">
        <Section id="acceptance" title="1. Introduction and acceptance">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Vouch ("we", "us",
            "our"), a testimonial collection and management platform operated from tryvouch.me.
            By creating an account, submitting a testimonial, or otherwise using the platform, you
            agree to these Terms and our{" "}
            <Link to="/privacy" className="text-brand-600 hover:text-brand-700">
              Privacy Policy
            </Link>
            . If you do not agree, please do not use the platform.
          </p>
          <p>
            We may update these Terms from time to time, as described in Section 15 below. Your
            continued use of the platform after changes take effect constitutes acceptance of the
            revised Terms.
          </p>
        </Section>

        <Section id="who-can-use" title="2. Who can use Vouch">
          <p>
            You must be at least 16 years old (or the applicable age of digital consent in your
            jurisdiction) to use Vouch. By using the platform you represent that you meet this
            requirement and that you have the authority to agree to these Terms on behalf of any
            entity you register for.
          </p>
          <p>
            Submitters provide testimonials without an account, at the invitation of an account
            holder ("Owner"). By submitting a testimonial, you accept these Terms to the extent they
            govern your submission.
          </p>
        </Section>

        <Section id="accounts" title="3. Accounts and credentials">
          <ul className="list-disc space-y-2 pl-5">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to notify us immediately if you believe your account has been compromised.</li>
            <li>You may not create accounts using false information or on behalf of someone else without their authorization.</li>
            <li>We may suspend or terminate accounts that violate these Terms or applicable law.</li>
          </ul>
        </Section>

        <Section id="billing" title="4. Subscriptions, billing, and payments">
          <p>
            Vouch is free to start. Paid plans are billed on a recurring subscription basis.
            Subscription fees and applicable taxes are charged in advance and vary by plan and
            billing period as displayed at checkout.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Payment processing</span> — all payments are handled by{" "}
              <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                Paddle
              </a>
              . We do not store credit-card numbers, bank details, or other financial credentials.
            </li>
            <li>
              <span className="font-medium">Renewals</span> — subscriptions renew automatically at
              the end of each billing period until cancelled.
            </li>
            <li>
              <span className="font-medium">Cancellation</span> — you may cancel at any time from
              your billing settings. Cancellation takes effect at the end of the current billing
              period; you retain access through the end of the period you paid for.
            </li>
            <li>
              <span className="font-medium">Refunds</span> — refunds are issued at our discretion in
              accordance with Paddle's refund policies. See our{" "}
              <Link to="/refunds" className="text-brand-600 hover:text-brand-700">
                Refund Policy
              </Link>
              . Fees paid are non-refundable except where required by law.
            </li>
            <li>
              <span className="font-medium">Price changes</span> — we may change plan prices or
              introduce new fees. We will provide reasonable notice before a price change takes
              effect, and it will apply from your next billing period.
            </li>
          </ul>
        </Section>

        <Section id="submissions" title="5. Testimonials and submissions">
          <p>
            Owners may create campaigns or one-time requests and share public links with their
            clients or customers, who submit video or text testimonials ("User Content").
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">Consent</span> — Submitters must actively consent, via a
              checkbox at submission, to their testimonial (including name, image, and recorded
              words) being collected, processed, and potentially published by the Owner. Vouch
              records this consent and will not accept a submission without it.
            </li>
            <li>
              <span className="font-medium">Ownership and responsibility</span> — you retain all
              rights to User Content you provide. You are solely responsible for it and represent
              that you own it or have the rights to share it, and that it does not infringe any
              third-party rights.
            </li>
            <li>
              <span className="font-medium">License to Vouch</span> — to operate the platform, you
              grant us a limited license to host, store, transmit, process (including AI processing
              described in Section 6), and display User Content to the extent needed to provide the
              service you request. This license does not grant us any ownership in your content.
            </li>
            <li>
              <span className="font-medium">Owner responsibility</span> — you are responsible for
              how you collect, use, and publish testimonials, including obtaining any further
              consents required by your jurisdiction and honoring submitter requests to remove
              content.
            </li>
          </ul>
        </Section>

        <Section id="ai-processing" title="6. AI processing">
          <p>
            Vouch automatically processes submitted videos to generate transcriptions, captions, and
            an AI-generated analysis (including sentiment, industry, pain points, outcomes,
            objections, and keywords) using third-party AI services. You acknowledge that:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>AI analysis is automated, may be inaccurate or incomplete, and does not represent professional advice.</li>
            <li>User Content transmitted to AI providers for processing is used solely to produce these outputs.</li>
            <li>Published AI-generated labels and captions are the Owner's responsibility to review before display.</li>
          </ul>
        </Section>

        <Section id="acceptable-use" title="7. Acceptable use">
          <p>You agree not to use Vouch to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Submit or publish content that is unlawful, defamatory, fraudulent, obscene, or infringing.</li>
            <li>Harass, threaten, or invade the privacy of any person.</li>
            <li>Collect testimonials from individuals without their consent, or for purposes other than those disclosed.</li>
            <li>Attempt to access, probe, or interfere with the platform, its infrastructure, or other users' data.</li>
            <li>Upload malicious code, attempt to abuse our systems, or circumvent any usage limits or security controls.</li>
            <li>Use the platform to violate any applicable law or third-party rights.</li>
          </ul>
          <p>
            We may remove or refuse to process content that violates these Terms, and may suspend or
            terminate the responsible account.
          </p>
        </Section>

        <Section id="embeds" title="8. Embeds and third-party websites">
          <p>
            Vouch offers embeddable testimonial sections that Owners may place on their own
            websites. You are responsible for ensuring that any website where you embed Vouch
            content complies with applicable law, displays our Privacy Policy and cookie disclosures
            where required, and does not misrepresent the origin of the testimonials. We are not
            responsible for the content or conduct of third-party websites that embed our content.
          </p>
        </Section>

        <Section id="ip" title="9. Intellectual property">
          <p>
            The Vouch platform, including its software, design, branding, and documentation, is owned
            by us or our licensors and is protected by intellectual-property laws. We grant you a
            limited, non-exclusive, non-transferable licence to use the platform for your own
            business purposes, in accordance with these Terms. You may not copy, modify, distribute,
            sell, or reverse-engineer the platform, or use it to build a competing product.
          </p>
        </Section>

        <Section id="third-party" title="10. Third-party services">
          <p>
            Vouch relies on third-party providers including AWS (storage and delivery), Supabase
            (database), Groq (AI transcription and analysis), Paddle (payments), and Resend (email).
            These providers operate under their own terms, which you may be subject to. We are not
            responsible for the acts or omissions of these providers beyond what is legally required
            of us.
          </p>
        </Section>

        <Section id="disclaimers" title="11. Disclaimers">
          <p>
            The platform is provided "as is" and "as available", without warranties of any kind,
            whether express or implied, including implied warranties of merchantability, fitness for
            a particular purpose, and non-infringement. We do not warrant that the platform will be
            uninterrupted, error-free, or secure, or that AI-generated outputs will be accurate.
          </p>
        </Section>

        <Section id="liability" title="12. Limitation of liability">
          <p>
            To the maximum extent permitted by law, neither we nor our affiliates, officers,
            directors, employees, or agents will be liable for any indirect, incidental, special,
            consequential, or punitive damages, or for any lost profits, data, or goodwill, arising
            out of or related to your use of the platform. Our total aggregate liability for all
            claims relating to the platform will not exceed the amount you paid us in the twelve (12)
            months preceding the claim. Nothing in these Terms limits liability that cannot be
            limited under applicable law.
          </p>
        </Section>

        <Section id="indemnification" title="13. Indemnification">
          <p>
            You agree to indemnify and hold harmless Vouch and its affiliates from any claims,
            damages, liabilities, and expenses (including reasonable legal fees) arising out of your
            use of the platform, your User Content, or your violation of these Terms or applicable
            law.
          </p>
        </Section>

        <Section id="termination" title="14. Termination">
          <p>
            You may stop using Vouch and delete your account at any time. We may suspend or terminate
            your access, in whole or in part, if you breach these Terms or applicable law, or where
            required to protect the platform or its users. Upon termination, your right to use the
            platform ends, and we may delete your User Content in accordance with our{" "}
            <Link to="/privacy" className="text-brand-600 hover:text-brand-700">
              Privacy Policy
            </Link>
            . Sections that by their nature should survive termination — including Sections 9
            through 13 — will survive.
          </p>
        </Section>

        <Section id="changes" title="15. Changes to these Terms">
          <p>
            We may modify these Terms to reflect changes in our service or legal requirements. When
            we make material changes, we will update the "Last updated" date at the top of this page
            and, where appropriate, notify you by email or a prominent notice on our website.
          </p>
        </Section>

        <Section id="governing-law" title="16. Governing law and disputes">
          <p>
            These Terms are governed by the laws of the jurisdiction in which Vouch is operated,
            without regard to conflict-of-law principles. You agree that any dispute arising from
            these Terms or your use of the platform will be resolved in the competent courts of that
            jurisdiction. Where applicable law provides otherwise, statutory consumer protections and
            compulsory provisions of local law remain unaffected.
          </p>
        </Section>

        <Section id="contact" title="17. Contact us">
          <p>
            If you have questions about these Terms, please contact us at:
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
          <Link to="/privacy" className="text-gray-500 transition-colors hover:text-gray-900">
            Privacy
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