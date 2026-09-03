import { redis, rateLimitRedis } from "../../config/redis";
import { logger } from "../../config/logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export class RateLimitService {
  static async consume(
    namespace: string,
    key: string,
    capacity: number,
    interval: number,
  ): Promise<RateLimitResult> {
    const redisKey = `rate:${namespace}:${key}`;

    const refillPerTokenMs = interval / capacity;

    try {
      const result = await rateLimitRedis.rateLimit(
        redisKey,
        capacity,
        refillPerTokenMs,
      );
      const [allowed, remaining] = result;

      return {
        allowed: allowed === 1,
        remaining,
      };
    } catch (error) {
      logger.error({ error }, "Rate limiter failed");

      // Fail open
      return {
        allowed: true,
        remaining: capacity,
      };
    }
  }

  static async reset(namespace: string, key: string) {
    await redis.del(`rate:${namespace}:${key}`);
  }
}
