import type { Request } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getSubscriptionStatus } from "../services/subscription.service";
import {
  createCustomerPortalUrl,
  getCheckoutContext,
  getRequestCountry,
  processPaddleEvent,
  unmarshalPaddleWebhook,
} from "../services/paddle.service";

export const getSubscription = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, "Unauthorized");

  const status = await getSubscriptionStatus(req.user.id);
  res.status(200).json(new ApiResponse(200, status, "Subscription status retrieved"));
});

export const getCountry = asyncHandler(async (req: Request, res) => {
  const country = getRequestCountry(req);
  res.status(200).json(new ApiResponse(200, { country }, "Country detected"));
});

export const getCheckoutContextHandler = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, "Unauthorized");

  const body = req.body as { plan: "pro" };
  const customData = await getCheckoutContext(req.user.id, body.plan);
  res.status(200).json(new ApiResponse(200, { customData }, "Checkout context created"));
});

export const createPortalLink = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, "Unauthorized");

  const url = await createCustomerPortalUrl(req.user.id);
  res.status(200).json(new ApiResponse(200, { url }, "Billing portal URL created"));
});

export const handlePaddleWebhook = asyncHandler(async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

  const event = await unmarshalPaddleWebhook(rawBody, req.get("Paddle-Signature"));
  await processPaddleEvent(event);

  // Always 200 after successful verification so Paddle stops retrying.
  res.status(200).json(new ApiResponse(200, null, "Webhook processed"));
});