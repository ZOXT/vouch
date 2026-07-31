// config/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BUCKET_NAME: z.string(),
  APP_URL: z.string(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  
  // Only needed in development — production uses IAM role
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Config with defaults
  ALLOWED_VIDEO_TYPES: z.string().transform(str => str.split(",")).default(["video/mp4,video/quicktime,video/webm"]),
  MAX_FILE_SIZE_MB: z.coerce.number().default(100),
  PRESIGNED_URL_EXPIRY: z.coerce.number().default(900),

  REDIS_URL : z.string(),

  GROQ_API_KEY: z.string(),
  GROQ_MODEL: z.string()
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;