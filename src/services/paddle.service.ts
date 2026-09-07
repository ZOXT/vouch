import crypto from "crypto";
import { Environment, Paddle, type SubscriptionStatus } from "@paddle/paddle-node-sdk";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { PAID_PLANS, type PaidPlan } from "./subscription.service";

// Maps the two price IDs (monthly + yearly, same plan) to the single paid
// plan. Prices are additive in Paddle's catalog, so optional env vars keep us
// honest about what's configured.
const PRICE_ID_TO_PLAN = (): Partial<Record<string, PaidPlan>> => ({
  ...(env.PADDLE_MONTH_PRICE_ID ? { [env.PADDLE_MONTH_PRICE_ID]: "pro" } : {}),
  ...(env.PADDLE_YEAR_PRICE_ID ? { [env.PADDLE_YEAR_PRICE_ID]: "pro" } : {}),
});

let client: Paddle | null = null;

/**
 * Lazily-built SDK client. PADDLE_ENV tells the SDK which API base to use, so
 * a misconfiguration fails at server boot (env.ts) instead of mid-request.
 */
export const getPaddleClient = (): Paddle => {
  if (!client) {
    if (!env.PADDLE_API_KEY) {
      throw new ApiError(503, "Billing is not configured yet");
    }
    client = new Paddle(env.PADDLE_API_KEY, {
      environment: env.PADDLE_ENV === "sandbox" ? Environment.sandbox : Environment.production,
    });
  }
  return client;
};

/**
 * Signs the checkout custom_data with the webhook secret so webhook events
 * can prove the userId came from our own checkout flow and was not tampered
 * with. Only the server knows this secret - it never reaches the browser.
 */
const signCustomData = (userId: string, plan: PaidPlan): string => {
  if (!env.PADDLE_WEBHOOK_SECRET) {
    throw new ApiError(503, "Billing is not configured yet");
  }
  return crypto
    .createHmac("sha256", env.PADDLE_WEBHOOK_SECRET)
    .update(`userId=${userId}&plan=${plan}`)
    .digest("hex");
};

const verifyCustomData = (
  customData: Record<string, unknown> | null | undefined,
): { userId: string; plan: PaidPlan } | null => {
  const userId = customData?.userId;
  const plan = customData?.plan;
  const sig = customData?.sig;
  if (typeof userId !== "string" || typeof plan !== "string" || typeof sig !== "string") {
    return null;
  }
  if (!PAID_PLANS.includes(plan as PaidPlan)) return null;

  const expected = crypto
    .createHmac("sha256", env.PADDLE_WEBHOOK_SECRET ?? "")
    .update(`userId=${userId}&plan=${plan}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(sig, "utf8");
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }
  return { userId, plan: plan as PaidPlan };
};

/**
 * Builds the signed custom_data the pricing page passes to
 * Paddle.Checkout.open(). The plan locks the webhook to a concrete tier so
 * entitlement never depends on trusting client input.
 */
export const getCheckoutContext = async (
  userId: string,
  plan: PaidPlan,
): Promise<Record<string, unknown>> => {
  if (!PAID_PLANS.includes(plan)) {
    throw new ApiError(400, "Invalid plan");
  }
  return { userId, plan, sig: signCustomData(userId, plan) };
};

const getRequestCountry = (req: { headers: Record<string, unknown> }): string | undefined => {
  const header =
    req.headers["x-vercel-ip-country"] ??
    req.headers["cloudfront-viewer-country"] ??
    req.headers["cf-ipcountry"];
  const value = Array.isArray(header) ? header[0] : header;
  return typeof value === "string" && /^[A-Z]{2}$/.test(value) ? value : undefined;
};

export { getRequestCountry };

/**
 * Opens a Paddle customer portal session so the user can self-serve
 * upgrades/downgrades/payment methods. Resolves the Paddle customer_id
 * server-side from the DB, never from the client.
 */
export const createCustomerPortalUrl = async (userId: string): Promise<string> => {
  const subscription = await prisma.subscription.findUnique({
    where: { user_id: userId },
    select: { customer_id: true, subscription_id: true },
  });

  if (!subscription?.customer_id) {
    throw new ApiError(400, "No billing account linked to this user");
  }

  const session = await getPaddleClient().customerPortalSessions.create(
    subscription.customer_id,
    subscription.subscription_id ? [subscription.subscription_id] : [],
  );

  return session.urls.general.overview;
};

/**
 * Validates the Paddle-Signature header against the raw body via the official
 * SDK and returns the unmarshalled, typed event.
 */
export const unmarshalPaddleWebhook = async (
  rawBody: Buffer,
  signature: string | undefined,
): Promise<{ eventType: string; data: Record<string, unknown> }> => {
  if (!env.PADDLE_WEBHOOK_SECRET) {
    throw new ApiError(503, "Paddle webhook secret is not configured");
  }
  if (!signature) {
    throw new ApiError(400, "Missing Paddle-Signature header");
  }

  try {
    const event = await getPaddleClient().webhooks.unmarshal(
      rawBody.toString("utf8"),
      env.PADDLE_WEBHOOK_SECRET,
      signature,
    );
    return { eventType: event.eventType, data: event.data as unknown as Record<string, unknown> };
  } catch (err) {
    logger.warn({ err }, "Paddle webhook verification failed");
    throw new ApiError(400, "Invalid Paddle webhook signature");
  }
};

interface SubscriptionEventData {
  id?: string;
  customer_id?: string;
  status?: SubscriptionStatus;
  current_billing_period?: { starts_at?: string; ends_at?: string } | null;
  next_billed_at?: string | null;
  canceled_at?: string | null;
  items?: { price?: { id?: string; product_id?: string } | null }[];
  scheduled_change?: { action?: string; effective_at?: string } | null;
  custom_data?: Record<string, unknown> | null;
}

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.activated",
  "subscription.canceled",
  "subscription.created",
  "subscription.imported",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.trialing",
  "subscription.updated",
]);

const planFromPriceId = (priceId: string | undefined): PaidPlan | undefined =>
  priceId ? PRICE_ID_TO_PLAN()[priceId] : undefined;

/**
 * Persists a Paddle subscription event into our Subscription table. Rows are
 * keyed on user_id; the signed custom_data is the primary source for the user
 * mapping, with the existing subscription_id used as an out-of-order/fallback
 * lookup. Entitlement is derived from (plan, status) at read time, so a
 * canceled/past_due/paused record automatically downgrades the account.
 */
export const processPaddleSubscriptionEvent = async (
  eventType: string,
  data: SubscriptionEventData,
): Promise<void> => {
  const verified = verifyCustomData(data.custom_data);
  const pricePlan = planFromPriceId(data.items?.[0]?.price?.id);

  const priceId = data.items?.[0]?.price?.id ?? null;
  const productId = data.items?.[0]?.price?.product_id ?? null;
  const currentPeriodEnd = data.current_billing_period?.ends_at
    ? new Date(data.current_billing_period.ends_at)
    : null;
  const scheduledChangeAt = data.scheduled_change?.effective_at
    ? new Date(data.scheduled_change.effective_at)
    : null;
  const status = data.status ?? "active";

  const plan = pricePlan ?? verified?.plan ?? null;
  const userId = verified?.userId;

  const existing = !userId
    ? await prisma.subscription.findUnique({
        where: { subscription_id: data.id ?? "" },
        select: { user_id: true },
      })
    : null;

  const resolvedUserId = userId ?? existing?.user_id;

  if (!resolvedUserId) {
    logger.warn(
      { eventType, subscriptionId: data.id },
      "Paddle subscription event has no resolvable user, skipping",
    );
    return;
  }

  await prisma.subscription.upsert({
    where: { user_id: resolvedUserId },
    create: {
      user_id: resolvedUserId,
      provider: "paddle",
      customer_id: data.customer_id ?? null,
      subscription_id: data.id ?? null,
      plan: plan ?? "free",
      status,
      price_id: priceId,
      product_id: productId,
      current_period_end: currentPeriodEnd,
      scheduled_change_action: data.scheduled_change?.action ?? null,
      scheduled_change_at: scheduledChangeAt,
    },
    update: {
      customer_id: data.customer_id ?? undefined,
      subscription_id: data.id ?? undefined,
      plan: plan ?? undefined,
      status,
      price_id: priceId,
      product_id: productId,
      current_period_end: currentPeriodEnd,
      scheduled_change_action: data.scheduled_change?.action ?? null,
      scheduled_change_at: scheduledChangeAt,
    },
  });

  logger.info(
    { eventType, userId: resolvedUserId, subscriptionId: data.id, status, plan },
    "Paddle subscription synced",
  );
};

export const processPaddleEvent = async (event: {
  eventType: string;
  data: Record<string, unknown>;
}): Promise<void> => {
  if (!SUBSCRIPTION_EVENTS.has(event.eventType)) {
    logger.info({ eventType: event.eventType }, "Ignoring unhandled Paddle event");
    return;
  }

  await processPaddleSubscriptionEvent(event.eventType, event.data as SubscriptionEventData);
};