import { logger } from "../config/logger";
import { segmentsToVtt, type CaptionSegment } from "../utils/captions";
import { uploadText } from "./s3.service";

export const getCaptionsKey = (testimonialId: string) =>
  `captions/${testimonialId}.vtt`;

/**
 * Converts transcription segments to WebVTT and uploads them to S3.
 * Returns the S3 key, or null when there are no usable segments.
 */
export const generateAndUploadCaptions = async (
  testimonialId: string,
  segments: CaptionSegment[],
): Promise<string | null> => {
  if (segments.length === 0) {
    logger.info({ testimonialId }, "No transcription segments, skipping captions");
    return null;
  }

  const vtt = segmentsToVtt(segments);
  const key = getCaptionsKey(testimonialId);

  await uploadText(key, vtt, "text/vtt");

  logger.info(
    { testimonialId, key, cueCount: segments.length },
    "Captions uploaded"
  );

  return key;
};
