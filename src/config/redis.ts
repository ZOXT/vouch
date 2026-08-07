  import Redis from "ioredis"
  import {env} from "./env"
  import { logger } from "./logger";

  export const redis = new Redis(env.REDIS_URL);

  redis.on("connect", ()=>{
      logger.info("Redis Connected!")
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });

  export const RATE_LIMIT_SCRIPT = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refill_ms_per_token = tonumber(ARGV[2])

    local redis_time = redis.call('TIME')
    local now = redis_time[1] * 1000 + math.floor(redis_time[2] / 1000)

    local bucket = redis.call('GET', key)

    if not bucket then
      bucket = {tokens = capacity, lastRefill = now}
    else
      bucket = cjson.decode(bucket)
      local elapsed = now - bucket.lastRefill
      local tokens_to_add = math.floor(elapsed / refill_ms_per_token)

      if tokens_to_add > 0 then
        bucket.tokens = math.min(capacity, bucket.tokens + tokens_to_add)
        bucket.lastRefill = bucket.lastRefill + (tokens_to_add * refill_ms_per_token)
      end
    end

    local allowed = 0
    local remaining = bucket.tokens

    if bucket.tokens > 0 then
      bucket.tokens = bucket.tokens - 1
      remaining = bucket.tokens
      allowed = 1
    end

    -- Dynamic TTL based on capacity and refill time
    local ttl = math.ceil((capacity * refill_ms_per_token) / 1000)
    redis.call('SET', key, cjson.encode(bucket), 'EX', ttl)

    return {allowed, remaining}
  `;

  // Registering the script for better performance
  export const rateLimitCommand = redis.defineCommand("rateLimit", {
    numberOfKeys: 1,
    lua: RATE_LIMIT_SCRIPT,
  });

  export interface RateLimitRedis extends Redis {
  rateLimit(
    key: string,
    capacity: number,
    refillPerTokenMs: number
  ): Promise<[number, number]>;
}

export const rateLimitRedis = redis as RateLimitRedis;