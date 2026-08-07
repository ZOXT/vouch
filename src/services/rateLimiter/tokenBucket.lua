import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// Define the Lua script
export const RATE_LIMIT_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refill_time = tonumber(ARGV[2])  -- ms between tokens
  local now = tonumber(ARGV[3])

  local bucket = redis.call('GET', key)
  
  if not bucket then
    bucket = {tokens = capacity, lastRefill = now}
  else
    bucket = cjson.decode(bucket)
    local elapsed = now - bucket.lastRefill
    local tokens_to_add = math.floor(elapsed / refill_time)
    
    if tokens_to_add > 0 then
      bucket.tokens = math.min(capacity, bucket.tokens + tokens_to_add)
      bucket.lastRefill = bucket.lastRefill + (tokens_to_add * refill_time)
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
  local ttl = math.ceil((capacity * refill_time) / 1000)
  redis.call('SET', key, cjson.encode(bucket), 'EX', ttl)

  return {allowed, remaining}
`;

// Register the script for better performance
export const rateLimitCommand = redis.defineCommand("rateLimit", {
  numberOfKeys: 1,
  lua: RATE_LIMIT_SCRIPT,
});