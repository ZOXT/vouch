import assert from "node:assert/strict";
import test from "node:test";
import { getFrameAncestors, isEmbedOriginAllowed, normalizeAllowedDomains } from "../src/utils/embed-domain";

test("normalizes and de-duplicates allowed embed domains", () => {
  assert.deepEqual(
    normalizeAllowedDomains([" Example.com ", "example.com", "*.Partner.com"]),
    ["example.com", "*.partner.com"],
  );
});

test("matches exact and wildcard allowed embed domains", () => {
  const allowed = ["example.com", "*.partner.com"];

  assert.equal(isEmbedOriginAllowed("https://example.com", allowed), true);
  assert.equal(isEmbedOriginAllowed("https://shop.partner.com", allowed), true);
  assert.equal(isEmbedOriginAllowed("https://partner.com", allowed), false);
  assert.equal(isEmbedOriginAllowed("https://untrusted.example", allowed), false);
});

test("builds frame-ancestors sources from allowed domains", () => {
  assert.equal(getFrameAncestors([]), "*");
  assert.equal(
    getFrameAncestors(["example.com", "*.partner.com"]),
    "https://example.com https://*.partner.com",
  );
});
