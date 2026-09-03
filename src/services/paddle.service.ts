import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

const PADDLE_API_BASE =
  env.PADDLE_ENV === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

/**
 * Creates a Paddle-hosted checkout for the Pro plan and returns its URL.
 * custom_data.userId is set server-side so the webhook can map the
 * subscription back to this user - it must never come from the client.
 */
export const createProCheckoutUrl = async (
  userId: string,
  email: string,
): Promise<string> => {
  if (!env.PADDLE_API_KEY || !env.PADDLE_PRO_PRICE_ID) {
    throw new ApiError(503, "Billing is not configured yet");
  }

  let response: Response;
  try {
    response = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
        "Paddle-Version": "1",
      },
      body: JSON.stringify({
        items: [{ price_id: env.PADDLE_PRO_PRICE_ID, quantity: 1 }],
        customer: { email },
        custom_data: { userId },
      }),
    });
  } catch (err) {
    logger.error({ err, userId }, "Paddle API request failed");
    throw new ApiError(502, "Could not reach the billing provider");
  }

  const body = (await response.json().catch(() => null)) as {
    data?: { checkout?: { url?: string } };
    error?: { detail?: string };
  } | null;

  const checkoutUrl = body?.data?.checkout?.url;

  if (!response.ok || !checkoutUrl) {
    logger.error(
      { userId, status: response.status, paddleError: body?.error },
      "Paddle transaction creation failed",
    );
    throw new ApiError(502, "Could not create a checkout, please try again");
  }

  logger.info({ userId }, "Created Paddle checkout URL");
  return checkoutUrl;
};

/**
 * Verifies the Paddle-Signature header (ts + h1) against the raw body.
 * https://developer.paddle.com/webhooks/signature-verification
 */
export const verifyPaddleSignature = (
  rawBody: Buffer,
  signatureHeader: string | undefined,
): void => {
  if (!env.PADDLE_WEBHOOK_SECRET) {
    throw new ApiError(503, "Paddle webhook secret is not configured");
  }

  if (!signatureHeader) {
    throw new ApiError(400, "Missing Paddle-Signature header");
  }

  const parts = new Map(
    signatureHeader.split(";").map((part) => {
      const idx = part.indexOf("=");
      return [part.slice(0, idx), part.slice(idx + 1)] as const;
    }),
  );

  const ts = parts.get("ts");
  const h1 = parts.get("h1");

  if (!ts || !h1) {
    throw new ApiError(400, "Malformed Paddle-Signature header");
  }

  const timestamp = Number(ts) * 1000;

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > SIGNATURE_TOLERANCE_MS) {
    throw new ApiError(400, "Paddle signature timestamp is outside the tolerance window");
  }

  const expected = crypto
    .createHmac("sha256", env.PADDLE_WEBHOOK_SECRET)
    .update(`${ts}:${rawBody.toString("utf8")}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(h1, "utf8");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new ApiError(400, "Invalid Paddle webhook signature");
  }
};

interface PaddleSubscriptionData {
  id?: string;
  customer_id?: string;
  status?: string;
  custom_data?: { userId?: string } | null;
  items?: { price?: { id?: string } }[];
  current_billing_period?: {
    ends_at?: string;
  } | null;
}

const HANDLED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "subscription.paused",
  "subscription.resumed",
]);

/**
 * Syncs a Paddle subscription event into our Subscription table. Entitlement
 * is derived from (plan, status) at read time, so a canceled/past_due record
 * automatically downgrades the account to free.
 */
export const processPaddleEvent = async (rawBody: Buffer): Promise<void> => {
  let event: { event_type?: string; data?: PaddleSubscriptionData };

  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new ApiError(400, "Invalid JSON payload");
  }

  if (!event.event_type || !HANDLED_EVENTS.has(event.event_type)) {
    logger.info({ eventType: event.event_type }, "Ignoring unhandled Paddle event");
    return;
  }

  const data = event.data ?? {};
  const userId = data.custom_data?.userId;

  if (!userId) {
    logger.warn(
      { eventType: event.event_type, subscriptionId: data.id },
      "Paddle event missing custom_data.userId, cannot map to a user",
    );
    return;
  }

  const hasProPrice = env.PADDLE_PRO_PRICE_ID
    ? (data.items ?? []).some((item) => item.price?.id === env.PADDLE_PRO_PRICE_ID)
    : true;

  await prisma.subscription.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      provider: "paddle",
      customer_id: data.customer_id ?? null,
      subscription_id: data.id ?? null,
      plan: hasProPrice ? "pro" : "free",
      status: data.status ?? "active",
      current_period_end: data.current_billing_period?.ends_at
        ? new Date(data.current_billing_period.ends_at)
        : null,
    },
    update: {
      customer_id: data.customer_id ?? undefined,
      subscription_id: data.id ?? undefined,
      plan: hasProPrice ? "pro" : "free",
      status: data.status ?? "active",
      current_period_end: data.current_billing_period?.ends_at
        ? new Date(data.current_billing_period.ends_at)
        : null,
    },
  });

  logger.info(
    {
      eventType: event.event_type,
      userId,
      subscriptionId: data.id,
      status: data.status,
    },
    "Paddle subscription synced",
  );
};
