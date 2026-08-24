import { env } from "../config/env";

export const getCloudFrontUrl = (
  key: string | null | undefined
): string | null => {
  if (!key) return null;

  return `https://${env.CLOUDFRONT_DOMAIN}/${key}`;
};

export const getThumbnailUrl = (
  key: string | null | undefined
): string | null => {
  return getCloudFrontUrl(key);
};

export const getVideoUrl = (
  key: string | null | undefined
): string | null => {
  return getCloudFrontUrl(key);
};