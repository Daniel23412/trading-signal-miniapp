import test from "node:test";
import assert from "node:assert/strict";
import { getBotCopy, LOCALES, normalizeLocale, suggestedLocaleForCountry } from "./locales.js";

test("premium Telegram start copy exists for all 16 languages", () => {
  assert.equal(LOCALES.length, 16);
  for (const [locale] of LOCALES) {
    const copy = getBotCopy(locale);
    assert.match(copy.open, /AI SIGNAL/);
    assert.ok(copy.start.split("\n").filter(Boolean).length >= 6, locale);
    assert.ok(copy.followup.length > 50, locale);
  }
});

test("locale aliases and conservative GEO suggestions work", () => {
  assert.equal(normalizeLocale("ua-UA"), "uk");
  assert.equal(normalizeLocale("cn"), "zh");
  assert.equal(suggestedLocaleForCountry("BR"), "pt");
  assert.equal(suggestedLocaleForCountry("NL"), null);
});
