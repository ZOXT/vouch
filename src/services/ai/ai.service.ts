import { env } from "../../config/env";
import { GroqProvider } from "./groq.provider";
import { AIAnalysisResult } from "./types";

const provider = new GroqProvider(
  env.GROQ_API_KEY,
  env.GROQ_MODEL ?? "openai/gpt-oss-120b"
);

export const analyzeTranscript = async (
  transcript: string
): Promise<AIAnalysisResult> => {
  return provider.analyze(transcript);
};
