import Groq from "groq-sdk";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { generateDownloadPresignedUrl } from "./s3.service";

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const transcribeAudio = async (audioKey: string): Promise<string> => {
  try {
    logger.info({ audioKey }, "Transcribing audio with Groq Whisper");

    const audioUrl = await generateDownloadPresignedUrl(audioKey);

    const response = await fetch(audioUrl);
    const audioBlob = await response.blob();

    const transcription = await groq.audio.transcriptions.create({
      file: audioBlob,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    logger.info(
      {
        audioKey,
        transcriptLength: transcription.text.length,
      },
      "Transcription successful"
    );

    return transcription.text;
  } catch (error) {
    logger.error({ error, audioKey }, "Groq transcription failed");
    throw new Error(
      `Groq transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};