import { Link } from "react-router-dom";
import { Quote } from "lucide-react";

const LAST_UPDATED = "September 13, 2026";

export const RefundsPage = () => (
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
        Refund Policy
      </h1>
      <p className="mt-3 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-gray-700">
        <Section id="summary" title="1. Policy summary">
          <p>
            Vouch offers paid subscriptions billed through{" "}
            <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
              Paddle
            </a>
            . We want you to be happy with Vouch. If you are not, you may request a refund within
            fourteen (14) days of the initial purchase as described below. This policy supplements —
            and does not replace — any consumer protections granted by applicable law.
          </p>
        </Section>

        <Section id="eligibility" title="2. When you can get a refund">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium">First purchase</span> — if Vouch does not meet your
              needs, you may request a full refund within 14 days of your first purchase. After this
              window, fees are non-refundable unless required by law.
            </li>
            <li>
              <span className="font-medium">Automatic renewals</span> — if you were charged for a
              renewal you did not want and notify us within 14 days of the renewal charge, we will
              refund it and cancel your subscription.
            </li>
            <li>
              <span className="font-medium">Duplicate or erroneous charges</span> — we will refund
              any charge made by mistake or in error, in full, as soon as it is identified.
            </li>
          </ul>
          <p>
            Partial periods are not refunded on a pro-rata basis when you cancel: cancellation stops
            future billing, and you keep access for the remainder of the period you already paid for.
          </p>
        </Section>

        <Section id="how" title="3. How refunds work">
          <ul className="list-disc space-y-2 pl-5">
            <li>Refunds are issued to the original payment method via Paddle.</li>
            <li>Once approved, refunds typically appear within 5–10 business days, depending on your bank or card issuer.</li>
            <li>Refunds are one-time per subscription unless provided otherwise by law.</li>
          </ul>
        </Section>

        <Section id="requesting" title="4. How to request a refund">
          <p>
            To request a refund, contact us at{" "}
            <a href="mailto:hello@tryvouch.me" className="text-brand-600 hover:text-brand-700">
              hello@tryvouch.me
            </a>{" "}
            with the email address used for your subscription, or reach out through{" "}
            <a href="https://www.paddle.com/help" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
              Paddle's help center
            </a>
            . We will respond within a reasonable time and, where eligible, process the refund at no
            additional cost to you.
          </p>
        </Section>

        <Section id="statutory" title="5. Your statutory rights">
          <p>
            Nothing in this policy limits your rights as a consumer under the laws of your
            jurisdiction, including your right to a refund where goods or digital services are
            defective, not as described, or not delivered. Where the law provides a longer refund
            period or additional remedies, those rights prevail over this policy.
          </p>
        </Section>

        <Section id="contact" title="6. Contact us">
          <p>
            Questions about this Refund Policy? Contact us at:
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