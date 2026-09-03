import { env } from "../config/env";
import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { s3Client } from "../config/s3";
import { ApiError } from "../utils/ApiError";
import { getTestimonialRequestByToken } from "./testimonial-request.service";
import { logger } from "../config/logger";
import fs from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export class S3UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S3UploadError";
  }
}

export class S3DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S3DownloadError";
  }
}

export const maxFileSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const uploadText = async (
  key: string,
  content: string,
  contentType: string,
): Promise<void> => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    logger.error({ err, key }, "Failed to upload text object");
    throw new S3UploadError("Failed to upload file");
  }
};

export const createPresignedUploadUrl = async (
  key: string,
  fileType: string,
): Promise<string> => {
  try {
    return await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      }),
      {
        expiresIn: env.PRESIGNED_URL_EXPIRY,
        signableHeaders: new Set(["content-type"]),
      },
    );
  } catch (err) {
    logger.error({ err, key }, "Failed to generate presigned upload URL");
    throw new ApiError(500, "Failed to generate upload URL");
  }
};

export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  token: string,
) => {
  if (!env.ALLOWED_VIDEO_TYPES.includes(fileType)) {
    throw new ApiError(
      400,
      `File type "${fileType}" not supported. Allowed: ${env.ALLOWED_VIDEO_TYPES.join(", ")}`,
    );
  }

  const request = await getTestimonialRequestByToken(token);

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Idempotency: if a usable upload key was already issued for this request
  // and it has not expired, reuse it rather than minting a fresh S3 key on
  // every call (retries / re-submits would otherwise create redundant keys).
  let key = request.upload_key ?? null;
  if (!key) {
    key = `originals/${request.user_id}/${nanoid()}/${sanitizedFileName}`;
  }

  const url = await createPresignedUploadUrl(key, fileType);

  await prisma.testimonialRequest.update({
    where: {
      id: request.id,
    },
    data: {
      upload_key: key,
      presigned_url_generated_at: new Date(),
    },
  });

  logger.info(
    { key, reused: Boolean(request.upload_key), bucket: env.AWS_BUCKET_NAME },
    "Generated presigned upload URL",
  );

  return { url, key, maxFileSizeBytes };
};

export const downloadText = async (key: string): Promise<string> => {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new S3DownloadError(`No file body returned for "${key}"`);
    }

    return await response.Body.transformToString("utf-8");
  } catch (err) {
    logger.error({ key, err }, "Failed to download text object from S3");

    if (err instanceof S3DownloadError) throw err;

    throw new S3DownloadError(`Failed to download "${key}" from S3`);
  }
};

export const downloadFromS3 = async (
    key: string,
    destinationPath: string,
  ): Promise<void> => {
  try {
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new S3DownloadError(`No file body returned for "${key}"`);
    }

    const writeStream = fs.createWriteStream(destinationPath);
    await pipeline(response.Body as Readable, writeStream);

    logger.info({ key, destinationPath }, "Downloaded file from S3");
  } catch (err) {
    logger.error({ key, err }, "Failed to download file from S3");

    if (err instanceof S3DownloadError) throw err;

    throw new S3DownloadError(`Failed to download "${key}" from S3`);
  }
};

export const uploadFile = async (
  filePath: string,
  key: string,
  contentType: string,
): Promise<string> => {
  try {
    const stats = await fs.promises.stat(filePath);
    const readStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      Body: readStream,
      ContentType: contentType,
      ContentLength: stats.size,
    });

    await s3Client.send(command);

    logger.info({ key, size: stats.size }, "Uploaded file to S3");

    return key;
  } catch (err) {
    logger.error({ key, filePath, err }, "Failed to upload file to S3");
    throw new S3UploadError(`Failed to upload "${key}" to S3`);
  }
};

export const generateDownloadPresignedUrl = async (
  key: string,
): Promise<string> => {
  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
      {
        expiresIn: 900,
      },
    );
  } catch (err) {
    logger.error({ key, err }, "Failed to generate download URL");

    throw new Error("Failed to generate download URL");
  }
};

export const verifyS3ObjectExists = async (key: string): Promise<boolean> => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );

    return true;
  } catch (err) {
    logger.warn(
      { key, err },
      "S3 object does not exist or could not be accessed",
    );

    return false;
  }
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );
    logger.info({ key }, "Deleted from s3");
  } catch (err) {
    logger.error({ key, err }, "Failed to delete from S3");
    throw new S3UploadError(`Failed to delete ${key}`);
  }
};

export const generateAvatarUploadUrl = async (
  userId: string,
  fileType: string,
) => {
  if (!env.ALLOWED_AVATAR_TYPES.includes(fileType)) {
    throw new ApiError(
      400,
      `File type "${fileType}" is not supported. Allowed: ${env.ALLOWED_AVATAR_TYPES.join(", ")}`,
    );
  }

  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension = extensionMap[fileType];
  if (!extension) {
    throw new ApiError(400, "Unsupported avatar type");
  }
  
  const key = `avatars/${userId}/${nanoid()}.${extension}`;

  try {
    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      }),
      {
        expiresIn: env.PRESIGNED_URL_EXPIRY,
        signableHeaders: new Set(["content-type"]),
      },
    );

    logger.info(
      {
        userId,
        key,
        contentType: fileType,
      },
      "Generated avatar upload URL",
    );

    return {
      url,
      key,
      maxFileSizeBytes: env.MAX_AVATAR_SIZE_MB * 1024 * 1024,
    };
  } catch (err) {
    logger.error(
      { err, userId },
      "Failed to generate avatar upload URL",
    );

    throw new ApiError(
      500,
      "Failed to generate avatar upload URL",
    );
  }
};

export const getS3ObjectMetadata = async (key: string) => {
  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      }),
    );

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
    };
  } catch (err) {
    logger.warn(
      { key, err },
      "Failed to retrieve S3 object metadata",
    );

    return null;
  }
};

export const confirmAvatarUpload = async (
  userId: string,
  key: string,
) => {
  const expectedPrefix = `avatars/${userId}/`;

  // Prevent a user from confirming an avatar belonging
  // to another user's S3 namespace.
  if (!key.startsWith(expectedPrefix)) {
    throw new ApiError(403, "Invalid avatar upload key");
  }

  const metadata = await getS3ObjectMetadata(key);

  if (!metadata) {
    throw new ApiError(
      400,
      "Avatar upload could not be found. Please upload the image again.",
    );
  }

  if (!metadata.contentType) {
    throw new ApiError(
      400,
      "Uploaded avatar is missing a content type.",
    );
  }

  if (!env.ALLOWED_AVATAR_TYPES.includes(metadata.contentType)) {
    throw new ApiError(
      400,
      "Uploaded file type is not supported as an avatar.",
    );
  }

  const maxAvatarSize =
    env.MAX_AVATAR_SIZE_MB * 1024 * 1024;

  if (
    metadata.contentLength !== undefined &&
    metadata.contentLength > maxAvatarSize
  ) {
    throw new ApiError(
      400,
      `Avatar exceeds the maximum size of ${env.MAX_AVATAR_SIZE_MB}MB.`,
    );
  }

  /*
   * Get the current user so we can remove the old avatar
   * after the new upload has been verified.
   */
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      avatar_url: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  /*
   * Store the S3 key, not a short-lived presigned URL.
   *
   * The key is the stable source of truth.
   */
  await prisma.user.update({
    where: { id: userId },
    data: {
      avatar_url: key,
    },
  });

  /*
   * Delete the old avatar only after the new avatar
   * has successfully been verified and saved.
   */
  if (user.avatar_url && user.avatar_url !== key) {
    try {
      await deleteFromS3(user.avatar_url);
    } catch (err) {
      /*
       * Don't fail the avatar update because cleanup of
       * the old object failed.
       *
       * The new avatar is already valid and saved.
       */
      logger.error(
        {
          userId,
          oldAvatarKey: user.avatar_url,
          err,
        },
        "Avatar updated but old avatar could not be deleted",
      );
    }
  }

  logger.info(
    {
      userId,
      key,
      contentType: metadata.contentType,
      size: metadata.contentLength,
    },
    "Avatar upload confirmed",
  );

  return {
    key,
  };
};