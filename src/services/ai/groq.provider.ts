import Groq from "groq-sdk";
import { z } from "zod";
import { logger } from "../../config/logger";
import { AIAnalysisProvider, AIAnalysisResult } from "./types";

const AnalysisResultSchema = z.object({
  summary: z.string().trim(),
  industry: z.string().trim(),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]),
  keywords: z.array(z.string().trim()).min(1).max(8),
  painPoints: z.array(z.string().trim()).max(10),
  outcomes: z.array(z.string().trim()).max(10),
  objections: z.array(z.string().trim()).max(10),
  customerType: z.string().trim(),
  language: z.string().trim(),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `
You are an expert business analyst.

Analyze the following customer testimonial.

Return ONLY valid JSON.

Schema:

{
  "summary": "string",
  "industry": "string",
  "sentiment": "positive | neutral | negative | mixed",
  "keywords": ["string"],
  "painPoints": ["string"],
  "outcomes": ["string"],
  "objections": ["string"],
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
- outcomes should contain the value or business outcomes described
- objections should contain concerns or objections mentioned by the customer
- customerType should be something like Individual, SMB, Enterprise, Student, etc.
- language should be the detected language
- confidence must be between 0 and 1

Return JSON only.
`;

export class GroqProvider implements AIAnalysisProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor(apiKey: string, model = "llama-3.3-70b-versatile") {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  async analyze(transcript: string): Promise<AIAnalysisResult> {
    const startedAt = Date.now();

    const completion = await this.client.chat.completions.create({
      model: this.model,
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

    const validation = AnalysisResultSchema.safeParse(parsed);

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
    const latencyMs = Date.now() - startedAt;
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

    return {
      ...result,
      usage: {
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        latencyMs,
      },
    };
  }
}
