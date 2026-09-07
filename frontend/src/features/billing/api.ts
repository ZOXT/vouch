import { apiFetch } from "@/lib/api/client";
import type { Plan, SubscriptionStatus } from "@/lib/api/types";

export type PaidPlan = Exclude<Plan, "free">;

export const billingApi = {
  getSubscription: () => apiFetch<SubscriptionStatus>("/subscription"),
  getCountry: () => apiFetch<{ country: string | null }>("/billing/country"),
  createCheckoutContext: (plan: PaidPlan) =>
    apiFetch<{ customData: Record<string, unknown> }>("/billing/checkout-context", {
      method: "POST",
      body: { plan },
    }),
  createPortalLink: () => apiFetch<{ url: string }>("/billing/portal"),
};

export const isPaidPlan = (plan: Plan): plan is PaidPlan => plan !== "free";