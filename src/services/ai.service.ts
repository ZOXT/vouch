// src/services/ai.service.ts

import Groq from "groq-sdk";
import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../config/logger";

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

const AI_MODEL = env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SYSTEM_PROMPT = `
You are an expert business analyst.

Analyze the following customer testimonial.

Return ONLY valid JSON.

Schema:

{
  "summary": "string",
  "industry": "string",
  "sentiment": "positive | neutral | negative",
  "keywords": ["string"],
  "painPoints": ["string"],
  "customerType": "string",
  "language": "string",
  "confidence": 0.95
}

Rules:

- summary should be concise (1-2 sentences)
- industry should be one category only
- sentiment must be positive, neutral or negative
- keywords should contain 3-8 important terms
- painPoints should contain customer problems mentioned
- customerType should be something like Individual, SMB, Enterprise, Student, etc.
- language should be the detected language
- confidence must be between 0 and 1

Return JSON only.
`;

const TranscriptAnalysisSchema = z.object({
  summary: z.string().trim(),
  industry: z.string().trim(),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  keywords: z.array(z.string().trim()).min(1).max(8),
  painPoints: z.array(z.string().trim()).max(10),
  customerType: z.string().trim(),
  language: z.string().trim(),
  confidence: z.number().min(0).max(1).optional(),
});

export type TranscriptAnalysis = z.infer<typeof TranscriptAnalysisSchema>;

const shouldRetry = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("econnrefused")
  );
};

const analyzeWithGroq = async (transcript: string): Promise<TranscriptAnalysis> => {
  const started = Date.now();

  const completion = await groq.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: transcript,
      },
    ],
  });

  const latencyMs = Date.now() - started;

  const content = completion.choices.at(0)?.message.content?.trim();

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid JSON.");
  }

  const validation = TranscriptAnalysisSchema.safeParse(parsed);

  if (!validation.success) {
    logger.error(
      {
        issues: validation.error.flatten(),
        response: parsed,
      },
      "Groq returned invalid schema"
    );

    throw new Error("Groq returned invalid schema.");
  }

  const result = validation.data;

  const usage = completion.usage;

  logger.info(
    {
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      sentiment: result.sentiment,
      industry: result.industry,
      latencyMs,
    },
    "AI analysis completed"
  );

  return result;
};

export const analyzeTranscript = async (
  transcript: string
): Promise<TranscriptAnalysis> => {
  const maxRetries = 3;

  logger.info(
    {
      transcriptLength: transcript.length,
      maxRetries,
    },
    "Starting AI analysis with retry logic"
  );

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeWithGroq(transcript);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const retryable = shouldRetry(error);

      if (isLastAttempt || !retryable) {
        if (!retryable) {
          logger.warn(
            {
              error: error instanceof Error ? error.message : "Unknown error",
              attempt,
            },
            "Non-retryable AI error, failing immediately"
          );
        }

        throw error;
      }

      const baseDelay = 1000 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 250);
      const delayMs = baseDelay + jitter;

      logger.warn(
        {
          error: error instanceof Error ? error.message : "Unknown error",
          attempt,
          nextRetryDelayMs: delayMs,
        },
        "Transient AI error, retrying"
      );

      await sleep(delayMs);
    }
  }

  throw new Error("Unreachable: AI analysis retry loop exhausted");
};