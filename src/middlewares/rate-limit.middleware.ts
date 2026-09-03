import { Request, Response, NextFunction } from "express";
import { RateLimitService } from "../services/rateLimiter/rate-limit.service";
import { logger } from "../config/logger";

export interface RateLimitConfig {
  /** Unique namespace so different limiters never share the same Redis key. */
  name: string;
  capacity: number;
  interval: number;
}

export const rateLimits: Record<string, RateLimitConfig> = {
  DEFAULT: { name: "default", capacity: 60, interval: 60_000 },
  STRICT: { name: "strict", capacity: 15, interval: 60_000 },
  RELAXED: { name: "relaxed", capacity: 60, interval: 60_000 },
  AUTH: { name: "auth", capacity: 30, interval: 60_000 },
};

export const rateLimitMiddleware =
  (config: RateLimitConfig = rateLimits.DEFAULT) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key =
      (req as any).user?.id ??
      req.ip ??
      req.socket.remoteAddress ??
      "unknown";

    try {
      const result = await RateLimitService.consume(
        config.name,
        key,
        config.capacity,
        config.interval
      );

      res.setHeader("X-RateLimit-Limit", config.capacity);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil((Date.now() + config.interval) / 1000)
      );

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again shortly.",
          retryAfter: Math.ceil(config.interval / 1000),
        });
      }

      next();
    } catch (error) {
      logger.error({ error }, "Rate limit middleware failed");

      // Fail open
      next();
    }
  };

export const strictRateLimit = rateLimitMiddleware(rateLimits.STRICT);
export const relaxedRateLimit = rateLimitMiddleware(rateLimits.RELAXED);
export const authRateLimit = rateLimitMiddleware(rateLimits.AUTH);
export const defaultRateLimit = rateLimitMiddleware(rateLimits.DEFAULT);