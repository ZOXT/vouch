import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from "express";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { ApiError } from "../utils/ApiError";

const CACHE_TTL_MS = 5 * 60 * 1000;

const PADDLE_IP_BASE =
  env.PADDLE_ENV === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

const ipv4ToInt = (ip: string): number => {
  const octets = ip.split(".");
  if (octets.length !== 4) return 0;
  return octets.reduce((acc, octet) => (acc * 256 + (Number(octet) & 0xff)) >>> 0, 0) >>> 0;
};

// Returns the first/last addresses of an IPv4 CIDR (or exact /32).
const cidrToRange = (cidr: string): { start: number; end: number } => {
  const [ip, rawBits = "32"] = cidr.split("/");
  const bits = Number(rawBits);
  const ipInt = ipv4ToInt(ip);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32 || ipInt === 0) {
    throw new ApiError(500, "Invalid Paddle CIDR entry");
  }
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const start = (ipInt & mask) >>> 0;
  const end = (start + ((2 ** (32 - bits)) - 1)) >>> 0;
  return { start, end };
};

interface AllowlistCache {
  ranges: { start: number; end: number }[];
  fetchedAt: number;
}

let cache: AllowlistCache | null = null;

const fetchPaddleIpRanges = async (): Promise<{ start: number; end: number }[]> => {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.ranges;

  let response: Response;
  try {
    response = await fetch(`${PADDLE_IP_BASE}/ips`);
  } catch (err) {
    logger.error({ err }, "Failed to fetch Paddle IP allowlist");
    throw new ApiError(502, "Could not reach the billing provider");
  }

  const body = (await response.json().catch(() => null)) as {
    data?: { ipv4_cidrs?: string[] };
  } | null;

  const cidrs = body?.data?.ipv4_cidrs;

  if (!response.ok || !Array.isArray(cidrs)) {
    logger.error({ status: response.status }, "Unexpected Paddle IP list response");
    throw new ApiError(502, "Could not load the Paddle IP allowlist");
  }

  const ranges = cidrs.map(cidrToRange);
  cache = { ranges, fetchedAt: Date.now() };
  logger.info({ count: ranges.length }, "Loaded Paddle IP allowlist");
  return ranges;
};

const isPaddleIp = async (ip: string | undefined): Promise<boolean> => {
  if (!ip) return false;
  const ranges = await fetchPaddleIpRanges();
  const intIp = ipv4ToInt(ip);
  if (intIp === 0) return false;
  return ranges.some(({ start, end }) => intIp >= start && intIp <= end);
};

/**
 * Webhooks must originate from Paddle's documented IP ranges. Applied only to
 * the webhook route; billing is genuinely optional until configured, so we
 * skip enforcement (the handler 503s anyway) when no API key is set.
 */
export const paddleIpAllowlist = async (
  req: ExpressRequest,
  _res: ExpressResponse,
  next: NextFunction,
): Promise<void> => {
  try {
    if (env.PADDLE_API_KEY && !(await isPaddleIp(req.ip))) {
      throw new ApiError(403, "Webhook source is not a Paddle IP");
    }
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(502, "Could not verify webhook source"));
  }
};