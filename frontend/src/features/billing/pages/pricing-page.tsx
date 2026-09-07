import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Quote, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import type { Plan, SubscriptionStatus } from "@/lib/api/types";
import { billingApi, isPaidPlan, type PaidPlan } from "@/features/billing/api";
import { areTierPriceIdsConfigured, BILLING_CYCLE_LABEL, TIERS, type BillingCycle } from "@/features/billing/tiers";
import { usePaddle } from "@/features/billing/use-paddle";

export const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { previewPrices, openCheckout } = usePaddle();

  const [cycle, setCycle] = useState<BillingCycle>("month");
  const [prices, setPrices] = useState<Map<string, { formattedTotal: string; currency: string }> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const bootstrapping = user === undefined;
  const signedIn = Boolean(user);
  const configured = areTierPriceIdsConfigured();
  const currentPlan: Plan = subscription?.plan ?? "free";

  // Best-effort country detection (server uses proxied IP headers; Paddle
  // auto-detects when absent — we never pass a sentinel).
  useEffect(() => {
    billingApi
      .getCountry()
      .then(({ country: detected }) => {
        if (detected) setCountry(detected);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    billingApi.getSubscription().then(setSubscription).catch(() => {});
  }, [signedIn]);

  const refreshPrices = useCallback(async () => {
    if (!configured) return;
    setPreviewError(null);
    try {
      const preview = await previewPrices(
        TIERS.map((tier) => tier.priceId[cycle]),
        country,
      );
      setPrices(
        new Map(
          [...preview.entries()].map(([id, previewData]) => [
            id,
            { formattedTotal: previewData.formattedTotal, currency: previewData.currency },
          ]),
        ),
      );
    } catch (err) {
      setPrices(null);
      setPreviewError(
        err instanceof Error ? err.message : "Could not load prices. Please try again.",
      );
    }
  }, [configured, cycle, country, previewPrices]);

  useEffect(() => {
    void refreshPrices();
  }, [refreshPrices]);

  const subscribe = async (tierId: PaidPlan) => {
    if (bootstrapping) return;
    if (!signedIn || !user) {
      navigate("/login");
      return;
    }
    const tier = TIERS.find((t) => t.id === tierId);
    if (!tier) return;
    const priceId = tier.priceId[cycle];
    if (!priceId || !configured) {
      toast.error("Billing is not configured yet. Please try again later.");
      return;
    }

    setSubscribingTier(tierId);
    try {
      const { customData } = await billingApi.createCheckoutContext(tierId);
      await openCheckout({
        priceId,
        email: user.email,
        customData,
        successUrl: `${window.location.origin}/welcome`,
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 503
          ? "Billing is not configured yet. Please try again later."
          : "Could not start checkout. Please try again.",
      );
    } finally {
      setSubscribingTier(null);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const { url } = await billingApi.createPortalLink();
      window.location.assign(url);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 400
          ? "No billing account is linked to this user."
          : "Could not open the billing portal. Please try again.",
      );
      setOpeningPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Shared top nav (mirrors the landing page) */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Quote className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900">Vouch</span>
          </Link>

          <div className="flex items-center gap-3">
            {signedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block"
                >
                  Dashboard
                </Link>
                {isPaidPlan(currentPlan) ? (
                  <Button size="sm" variant="outline" loading={openingPortal} onClick={openPortal}>
                    Manage billing
                  </Button>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                  >
                    Go to dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:block"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero + toggle */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-indigo-50">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
            <div className="animate-fade-in mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
                <Star className="h-3.5 w-3.5 fill-brand-400 text-brand-400" />
                Simple pricing that scales with you
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                One plan, unlimited testimonials
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
                Start free, upgrade when you&apos;re ready. The Pro plan unlocks unlimited
                testimonials — so you never hit a wall on the thing that matters most.
              </p>

              <div className="mt-8 inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setCycle("month")}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    cycle === "month" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setCycle("year")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                    cycle === "year" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  Yearly
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      cycle === "year" ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700",
                    )}
                  >
                    Billed yearly
                  </span>
                </button>
              </div>

              {previewError && (
                <div className="mx-auto mt-6 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {previewError}
                </div>
              )}
              {!configured && (
                <div className="mx-auto mt-6 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Billing is not configured yet. Add the Paddle price IDs to <code>tiers.ts</code> and
                  the server env to enable checkout.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Plan card */}
        <section className="mx-auto -mt-8 max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-md justify-center">
            {TIERS.map((tier) => {
              const preview = prices?.get(tier.priceId[cycle]);
              const isCurrent = isPaidPlan(currentPlan);
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-white p-6",
                    tier.highlighted
                      ? "border-brand-300 shadow-xl shadow-brand-100"
                      : "border-gray-200 shadow-sm",
                  )}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Most popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                  <p className="mt-1 min-h-10 text-sm leading-relaxed text-gray-500">{tier.description}</p>

                  <div className="mt-5 flex min-h-14 items-baseline gap-1.5">
                    {preview ? (
                      <>
                        <span className="font-display text-4xl font-bold tracking-tight text-gray-900">
                          {preview.formattedTotal}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {BILLING_CYCLE_LABEL[cycle]}
                        </span>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                      </div>
                    )}
                  </div>
                  {preview && cycle === "month" ? (
                    <p className="text-xs text-gray-400">{preview.currency}</p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Billed yearly — that&apos;s $29/month
                    </p>
                  )}

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-1 flex-col justify-end">
                    {isCurrent ? (
                      <Button variant="outline" disabled>
                        Current plan
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={tier.highlighted ? "primary" : "secondary"}
                        loading={subscribingTier === tier.id}
                        onClick={() => subscribe(tier.id)}
                      >
                        {tier.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    <p className="mt-3 text-center text-xs text-gray-400">
                      Tax may apply. Cancel anytime.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free tier strip */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-brand-50 p-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                <Sparkles className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Exploring Vouch? Start free</p>
                <p className="text-sm text-gray-500">
                  5 testimonials, 1 campaign, and 1 embed section. No credit card required.
                </p>
              </div>
            </div>
            {signedIn ? (
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Open dashboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/register")}>
                Create free account
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isPaidPlan(currentPlan) && (
            <p className="mt-6 text-center text-sm text-gray-500">
              You&apos;re on Pro. Need to change plans?{" "}
              <button onClick={openPortal} className="font-medium text-brand-600 hover:text-brand-700">
                Manage billing
              </button>
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Vouch. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-gray-500 transition-colors hover:text-gray-900">
              Privacy
            </Link>
            <button className="text-gray-500 transition-colors hover:text-gray-900">Terms</button>
            <button onClick={() => navigate("/")} className="text-gray-500 transition-colors hover:text-gray-900">
              Back to home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};