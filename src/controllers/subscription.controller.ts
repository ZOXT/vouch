import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getSubscriptionStatus } from "../services/subscription.service";
import {
  createProCheckoutUrl,
  processPaddleEvent,
  verifyPaddleSignature,
} from "../services/paddle.service";

export const getSubscription = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, "Unauthorized");

  const status = await getSubscriptionStatus(req.user.id);
  res.status(200).json(new ApiResponse(200, status, "Subscription status retrieved"));
});

export const createCheckout = asyncHandler(async (req, res) => {
  if (!req.user?.id || !req.user.email) throw new ApiError(401, "Unauthorized");

  const url = await createProCheckoutUrl(req.user.id, req.user.email);
  res.status(200).json(new ApiResponse(200, { url }, "Checkout URL created"));
});

export const handlePaddleWebhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

  verifyPaddleSignature(rawBody, req.get("Paddle-Signature"));
  await processPaddleEvent(rawBody);

  // Always 200 after successful verification so Paddle stops retrying.
  res.status(200).json(new ApiResponse(200, null, "Webhook processed"));
});
