import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";


export const s3Client = new S3Client({
  region: env.AWS_REGION,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",

  // Only pass credentials in development
  // Production: SDK automatically uses IAM role
  ...(env.NODE_ENV !== "production" && 
    env.AWS_ACCESS_KEY_ID && 
    env.AWS_SECRET_ACCESS_KEY && {
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
  }),

  maxAttempts: 3,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5000,
    socketTimeout: 10000,
    httpsAgent: new Agent({
      keepAlive: true,
      maxSockets: 50,
    }),
  }),
});

