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
import fs, { write, WriteStream } from "fs";
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

const maxFileSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const key = `originals/${request.user_id}/${nanoid()}/${sanitizedFileName}`;

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
      { key, bucket: env.AWS_BUCKET_NAME },
      "Generated presigned upload URL",
    );

    return { url, key, maxFileSizeBytes };
  } catch (err) {
    logger.error({ err }, "Failed to generate presigned upload URL");
    throw new ApiError(500, "Failed to generate upload URL");
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
