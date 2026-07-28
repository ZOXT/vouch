import Groq from "groq-sdk";
import { env } from "../config/env";
import { logger } from "../config/logger";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export const transcribeAudio = async (audioUrl: string): Promise<string> => {
  try {
    logger.info("Sending audio to Groq for transcription");

    const transcription = await groq.audio.transcriptions.create({
      url: audioUrl,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      language: "en",
      temperature: 0,
    });

    const transcript = typeof transcription === "string"
      ? transcription
      : transcription.text;

    if (!transcript?.trim()) {
      throw new TranscriptionError("Groq returned an empty transcript");
    }

    logger.info({
      transcriptLength: transcript.length,
    }, "Transcription completed");

    return transcript;
  } catch (err) {
    logger.error({ err }, "Groq transcription failed");
    throw new TranscriptionError(
      err instanceof Error ? err.message : "Unknown transcription error"
    );
  }
};