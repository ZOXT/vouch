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