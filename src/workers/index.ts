/**
 * Combined entrypoint: runs all four BullMQ workers in a single process.
 *
 * Each BullMQ Worker targets its own queue by name in the same Redis
 * instance, so jobs stay fully isolated even though the processes share one
 * Node runtime. This is a memory optimization for small instances
 * (t3.small = 2 GB): four separate Node processes each load Prisma + env
 * (~150 MB+ each), while one combined process stays around 250 MB.
 *
 * Run with `npm run workers:combined` (compiled) or via `tsx`.
 */

import "dotenv/config";

import "./media.worker";
import "./transcription.worker";
import "./ai.worker";
import "./embedding.worker";

import { logger } from "../config/logger";

logger.info("All workers started (media, transcription, ai, embedding)");