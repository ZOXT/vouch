export const detectPII = (text: string) => {
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  };

  const detected: string[] = [];
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) detected.push(type);
  }

  return {
    hasEmail: detected.includes("email"),
    hasPhone: detected.includes("phone"),
    hasCreditCard: detected.includes("creditCard"),
    hasSSN: detected.includes("ssn"),
    detected,
    hasPII: detected.length > 0,
  };
};

export const maskPII = (text: string): string => {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL REDACTED]")
    .replace(/\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, "[PHONE REDACTED]")
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD REDACTED]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN REDACTED]");
};

export const calculateRiskScore = (detected: string[]): {
  score: number;
  level: "low" | "medium" | "high";
} => {
  const weights: Record<string, number> = {
    ssn: 1.0,
    creditCard: 0.9,
    phone: 0.5,
    email: 0.3,
  };

  const score = detected.reduce((sum, type) => sum + (weights[type] ?? 0.2), 0);
  const normalized = Math.min(score, 1.0);

  return {
    score: normalized,
    level: normalized >= 0.7 ? "high" : normalized >= 0.4 ? "medium" : "low",
  };
};