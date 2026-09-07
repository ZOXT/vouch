export type BillingCycle = "month" | "year";

export type TierId = "pro";

export const PLAN_LABELS: Record<TierId, string> = {
  pro: "Pro",
};

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  month: "month",
  year: "year",
};

export interface Tier {
  id: TierId;
  name: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  /** Live/sandbox Paddle price IDs for the plan (monthly + yearly). */
  priceId: Record<BillingCycle, string>;
}

// Single paid plan — $29/mo or $348/yr (2 months free), both mapped to the
// same entitlement server-side. Price IDs are filled in from the Paddle
// catalog; the pricing page shows a "not configured" state until these are set
// and the server's PADDLE_*_PRICE_ID vars match.
export const TIERS: Tier[] = [
  {
    id: "pro",
    name: "Pro",
    description: "For anyone turning happy customers into social proof.",
    features: [
      "Unlimited testimonials",
      "Unlimited campaigns & embed sections",
      "AI transcription, captions & analysis",
      "Full-text search across testimonials",
      "Advanced AI insights & sentiment",
      "Remove Vouch branding on embeds",
      "Priority support",
    ],
    cta: "Go Pro",
    highlighted: true,
    priceId: { month: "pri_01m1xmvqdq5rysnk4ry621s3x1", year: "pri_01m1xxdc7wwb5tsa4gpbv82h36" },
  },
];

/** All price IDs must be wired up before checkout can work. */
export const areTierPriceIdsConfigured = (): boolean =>
  TIERS.every((tier) => tier.priceId.month !== "" && tier.priceId.year !== "");