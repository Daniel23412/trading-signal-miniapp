import test from "node:test";
import assert from "node:assert/strict";
import { extractRequestGeo, normalizeUserId, parseAmount } from "./database.js";

test("amount and Telegram ID parsing rejects malformed values", () => {
  assert.equal(parseAmount("$10,50"), 10.5);
  assert.equal(parseAmount("not-a-number"), 0);
  assert.equal(normalizeUserId("867371536"), "867371536");
  assert.equal(normalizeUserId("12 OR 1=1"), "");
});

test("GEO never invents or accepts proxy placeholder countries", () => {
  const unknown = extractRequestGeo({ headers: { "x-vercel-ip-country": "XX", "x-vercel-ip-city": "Nowhere" } });
  assert.equal(unknown.country, null);
  assert.equal(unknown.status, "unknown");
  const detected = extractRequestGeo({ headers: { "x-vercel-ip-country": "NL", "x-vercel-ip-city": "Amsterdam" } });
  assert.equal(detected.country, "NL");
  assert.equal(detected.status, "detected");
});
