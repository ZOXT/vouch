import assert from "node:assert/strict";
import test from "node:test";
import { calculateRiskScore, detectPII, maskPII } from "../src/services/pii.service";

test("detects and masks supported PII", () => {
  const input = "Email alex@example.com or call 212-555-0199.";
  const detected = detectPII(input);

  assert.equal(detected.hasPII, true);
  assert.deepEqual(detected.detected.sort(), ["email", "phone"]);
  assert.equal(maskPII(input), "Email [EMAIL REDACTED] or call [PHONE REDACTED].");
});

test("calculates the expected privacy risk level", () => {
  assert.deepEqual(calculateRiskScore(["email"]), { score: 0.3, level: "low" });
  assert.deepEqual(calculateRiskScore(["phone"]), { score: 0.5, level: "medium" });
  assert.deepEqual(calculateRiskScore(["creditCard"]), { score: 0.9, level: "high" });
});
