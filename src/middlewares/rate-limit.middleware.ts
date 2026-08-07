import { Request, Response, NextFunction } from "express";
import { RateLimitService } from "../services/rateLimiter/rate-limit.service";
import { logger } from "../config/logger";

export const rateLimits = {
  DEFAULT: { capacity: 5, interval: 60_000 },
  STRICT: { capacity: 3, interval: 60_000 },
  RELAXED: { capacity: 20, interval: 60_000 },
  AUTH: { capacity: 10, interval: 60_000 },
};

export const rateLimitMiddleware =
  (config = rateLimits.DEFAULT) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key =
      (req as any).user?.id ??
      req.ip ??
      req.socket.remoteAddress ??
      "unknown";

    try {
      const result = await RateLimitService.consume(
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
          message: "Rate limit exceeded.",
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