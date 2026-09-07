import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PartyPopper, Quote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SubscriptionStatus } from "@/lib/api/types";
import { billingApi, isPaidPlan, type PaidPlan } from "@/features/billing/api";
import { PLAN_LABELS } from "@/features/billing/tiers";

export const WelcomePage = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    billingApi.getSubscription().then(setSubscription).catch(() => {});
  }, []);

  const plan = subscription && isPaidPlan(subscription.plan) ? (subscription.plan as PaidPlan) : null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-white to-indigo-50">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Quote className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-gray-900">Vouch</span>
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="animate-fade-in mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
            <PartyPopper className="h-8 w-8 text-white" />
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to {plan ? PLAN_LABELS[plan] : "Vouch"}
          </h1>
          <p
            className={cn(
              "mx-auto mt-3 max-w-md text-lg leading-relaxed text-gray-600",
              !plan && "text-sm text-amber-700",
            )}
          >
            {plan
              ? `Your ${PLAN_LABELS[plan]} plan is active — unlimited testimonials, campaigns, and embed sections are unlocked.`
              : "Your subscription is being activated. This usually takes a few seconds — check back shortly."}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg">
                <Sparkles className="h-4 w-4" />
                Go to dashboard
              </Button>
            </Link>
            {plan && (
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  Manage plan
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};