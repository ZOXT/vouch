import Groq from "groq-sdk";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { generateDownloadPresignedUrl } from "./s3.service";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export interface TranscriptionResult {
  transcript: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
  };
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export const transcribeAudio = async (
  audioKey: string
): Promise<TranscriptionResult> => {
  const startedAt = Date.now();

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

    const usage = (
      transcription as {
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
      }
    ).usage;

    logger.info(
      {
        audioKey,
        transcriptLength: transcript.length,
      },
      "Transcription completed"
    );

    return {
      transcript,
      usage: {
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        latencyMs: Date.now() - startedAt,
      },
    };
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