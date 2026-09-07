import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

// Single paid plan called "Pro" ($29/mo or $348/yr). All paid entitlement is
// identical, so the model is purely paid-vs-free.
export type Plan = "free" | "pro";
export type PaidPlan = Exclude<Plan, "free">;

export const PAID_PLANS: readonly PaidPlan[] = ["pro"];

export const isPaidPlan = (plan: string | null | undefined): plan is PaidPlan =>
  typeof plan === "string" && (PAID_PLANS as readonly string[]).includes(plan);

export const PLAN_LABELS: Record<Exclude<Plan, "free">, string> = {
  pro: "Pro",
};

export interface PlanLimits {
  testimonials: number;
  campaigns: number;
  embedSections: number;
}

const UNLIMITED = {
  testimonials: Number.POSITIVE_INFINITY,
  campaigns: Number.POSITIVE_INFINITY,
  embedSections: Number.POSITIVE_INFINITY,
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { testimonials: 5, campaigns: 1, embedSections: 1 },
  // Paid plan carries the same unlimited entitlement (see AGENTS.md).
  pro: UNLIMITED,
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export const getUserPlan = async (userId: string): Promise<Plan> => {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
    select: { plan: true, status: true },
  });

  if (
    subscription &&
    isPaidPlan(subscription.plan) &&
    ACTIVE_STATUSES.has(subscription.status)
  ) {
    return subscription.plan as Plan;
  }

  return "free";
};

const UPGRADE_HINT = "Upgrade to Pro for unlimited access.";

export const assertCanReceiveTestimonial = async (userId: string): Promise<void> => {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].testimonials;

  const count = await prisma.testimonial.count({
    where: { user_id: userId, deleted_at: null },
  });

  if (count >= limit) {
    throw new ApiError(
      403,
      `This account has reached the ${limit}-testimonial limit of the Free plan. ${UPGRADE_HINT}`,
    );
  }
};

export const assertCanCreateCampaign = async (userId: string): Promise<void> => {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].campaigns;

  const count = await prisma.campaign.count({ where: { user_id: userId } });

  if (count >= limit) {
    throw new ApiError(
      403,
      `The Free plan includes ${limit} campaign. ${UPGRADE_HINT}`,
    );
  }
};

export const assertCanCreateEmbedSection = async (userId: string): Promise<void> => {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].embedSections;

  const count = await prisma.embedSection.count({ where: { user_id: userId } });

  if (count >= limit) {
    throw new ApiError(
      403,
      `The Free plan includes ${limit} embed section. ${UPGRADE_HINT}`,
    );
  }
};

export interface SubscriptionStatus {
  plan: Plan;
  status: string;
  currentPeriodEnd: Date | null;
  limits: PlanLimits;
  usage: {
    testimonials: number;
    campaigns: number;
    embedSections: number;
  };
}

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionStatus> => {
  const [subscription, testimonials, campaigns, embedSections] = await Promise.all([
    prisma.subscription.findUnique({
      where: { user_id: userId },
      select: { plan: true, status: true, current_period_end: true },
    }),
    prisma.testimonial.count({ where: { user_id: userId, deleted_at: null } }),
    prisma.campaign.count({ where: { user_id: userId } }),
    prisma.embedSection.count({ where: { user_id: userId } }),
  ]);

  const plan: Plan =
    subscription && isPaidPlan(subscription.plan) && ACTIVE_STATUSES.has(subscription.status)
      ? (subscription.plan as Plan)
      : "free";

  return {
    plan,
    status: subscription?.status ?? "active",
    currentPeriodEnd: subscription?.current_period_end ?? null,
    limits: PLAN_LIMITS[plan],
    usage: { testimonials, campaigns, embedSections },
  };
};
