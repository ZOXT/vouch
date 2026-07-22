import { env } from "../config/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { s3Client } from "../config/s3";
import { ApiError } from "../utils/ApiError";
import { getTestimonialRequestByToken } from "./testimonial-request.service";
import { logger } from "../config/logger";

const maxFileSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  token: string
) => {

  if (!env.ALLOWED_VIDEO_TYPES.includes(fileType)) {
    throw new ApiError(400, `File type "${fileType}" not supported. Allowed: ${env.ALLOWED_VIDEO_TYPES.join(", ")}`);
  }

  const request = await getTestimonialRequestByToken(token);

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `originals/${request.user_id}/${nanoid()}/${sanitizedFileName}`;

  try {
    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME, 
        Key: key,
        ContentType: fileType,
      }),
      { expiresIn: env.PRESIGNED_URL_EXPIRY,
        signableHeaders: new Set(["content-type"]),
        
      } 
      
    );

    logger.debug({ bucket: env.AWS_BUCKET_NAME }, "Generated presigned upload URL");

    return { url, key };
  } catch (error) {
    logger.error({ err: error }, "Presigned URL generation failed");
    throw new ApiError(500, "Failed to generate upload URL");
  }
};