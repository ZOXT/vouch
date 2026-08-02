import Groq from "groq-sdk";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { generateDownloadPresignedUrl } from "./s3.service";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export const transcribeAudio = async (audioKey: string): Promise<string> => {
  try {
    const audioUrl = await generateDownloadPresignedUrl(audioKey);

    logger.info(
      { audioKey },
      "Generated presigned URL, sending audio to Groq"
    );

    const transcription = await groq.audio.transcriptions.create({
      url: audioUrl,
      model: env.GROQ_WHISPER_MODEL,
      response_format: "verbose_json",
      language: "en",
      temperature: 0,
    });

    const transcript =
      typeof transcription === "string"
        ? transcription
        : transcription.text;

    if (!transcript?.trim()) {
      throw new TranscriptionError(
        "Groq returned an empty transcript"
      );
    }

    logger.info(
      {
        audioKey,
        transcriptLength: transcript.length,
      },
      "Transcription completed"
    );

    return transcript;

  } catch (err) {
    logger.error(
      { err },
      "Groq transcription failed"
    );

    throw new TranscriptionError(
      err instanceof Error
        ? err.message
        : "Unknown transcription error"
    );
  }
};