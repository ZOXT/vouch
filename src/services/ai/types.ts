export interface AIAnalysisProvider {
  analyze(transcript: string): Promise<AIAnalysisResult>;
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs?: number;
}

export interface AIAnalysisResult {
  summary: string;
  industry: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  keywords: string[];
  painPoints: string[];
  outcomes: string[];
  objections: string[];
  customerType: string;
  language: string;
  confidence: number;
  usage: AIUsageMetrics;
}
