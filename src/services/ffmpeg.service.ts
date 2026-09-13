import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import fs from "fs";
import path from "path";
import os from "os";
import { logger } from "../config/logger";
import { MAX_TESTIMONIAL_DURATION_SECONDS as MAX_DURATION_SECONDS } from "../utils/media-limits";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const ALLOWED_CODECS = new Set(["h264", "hevc", "vp9", "av1"]);

const IMAGE_FORMAT_HINTS = [
  "gif",
  "png",
  "jpeg",
  "jpg",
  "mjpeg",
  "webp",
  "bmp",
  "tiff",
  "tif",
  "avif",
  "image2",
];

const FRIENDLY_FORMAT_HINT = "Please upload an MP4, MOV, or WebM video file.";

const isImageFormat = (formatName: string): boolean => {
  const lower = formatName.toLowerCase();
  return IMAGE_FORMAT_HINTS.some((hint) => lower.includes(hint));
};

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

export class MediaProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaProcessingError";
  }
}

export interface MediaInfo {
  duration: number;
  codec: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

export const createTempDirectory = async (
  testimonialId: string,
): Promise<string> => {
  return fs.promises.mkdtemp(path.join(os.tmpdir(), `vouch-${testimonialId}-`));
};

export const cleanupTempDirectory = async (
  directory: string,
): Promise<void> => {
  try {
    await fs.promises.rm(directory, {
      recursive: true,
      force: true,
    });

    logger.info({ directory }, "Temporary directory removed");
  } catch (err) {
    logger.warn({ directory, err }, "Failed to cleanup temp directory");
  }
};

export const validateMedia = (filePath: string): Promise<MediaInfo> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(
          new MediaValidationError(
            `We couldn't read this file. It may be corrupted or not a video. ${FRIENDLY_FORMAT_HINT}`,
          ),
        );
        return;
      }

      const formatName = metadata.format?.format_name ?? "";
      if (isImageFormat(formatName)) {
        reject(
          new MediaValidationError(
            `That's an image, not a video. ${FRIENDLY_FORMAT_HINT}`,
          ),
        );
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );
      if (!videoStream) {
        reject(
          new MediaValidationError(
            `We couldn't find any video in this file. ${FRIENDLY_FORMAT_HINT}`,
          ),
        );
        return;
      }

      const hasAudio = metadata.streams.some(
        (stream) => stream.codec_type === "audio",
      );
      if (!hasAudio) {
        reject(
          new MediaValidationError(
            "This video has no audio. Please upload a video with sound so we can transcribe what's said.",
          ),
        );
        return;
      }

      const duration = Number(metadata.format.duration ?? 0);

      if (duration > MAX_DURATION_SECONDS) {
        reject(
          new MediaValidationError(
            `Videos can be up to ${MAX_DURATION_SECONDS} seconds long. Please submit a shorter video.`,
          ),
        );
        return;
      }
      const codec = videoStream.codec_name ?? "";
      if (!ALLOWED_CODECS.has(codec)) {
        reject(
          new MediaValidationError(
            `Your video uses a format we can't process (${codec}). ${FRIENDLY_FORMAT_HINT}`,
          ),
        );
        return;
      }
      resolve({
        duration: Math.round(duration),
        codec,
        width: videoStream.width ?? 0,
        height: videoStream.height ?? 0,
        fileSizeBytes: Number(metadata.format.size ?? 0),
      });
    });
  });
};

export const generateThumbnail = (
  inputPath: string,
  outputDirectory: string,
  duration: number,
): Promise<string> => {
  //v short videos might not even reach the 1s mark
  const timestamp = duration >= 2 ? 1 : duration / 2;

  const outputPath = path.join(outputDirectory, "thumbnail.jpg");

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: "thumbnail.jpg",
        folder: outputDirectory,
        size: "720x?",
      })
      .on("end", () => {
        logger.info(
          {
            inputPath,
            outputPath,
          },
          "Thumbnail generated successfully",
        );
        resolve(outputPath);
      })
      .on("error", (err) => {
        reject(
          new MediaProcessingError(
            `Failed to generate thumbnail: ${err.message}`,
          ),
        );
      });
  });
};

//extract audio from the video as mp3 and returns absolute path of the generated audio file

export const extractAudio = (
  inputPath: string,
  outputDirectory: string,
): Promise<string> => {
  const outputPath = path.join(outputDirectory, "audio.mp3");

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .output(outputPath)
      .on("end", () => {
        logger.info(
          {
            inputPath,
            outputPath,
          },
          "Audio extracted successfully",
        );
        resolve(outputPath);
      })
      .on("error", (err) => {
        reject(
          new MediaProcessingError(`
        Failed to extract audio: ${err.message}`),
        );
      })
      .run();
  });
};
