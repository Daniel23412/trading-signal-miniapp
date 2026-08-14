import test from "node:test";
import assert from "node:assert/strict";
import { getBotCopy, LOCALES, normalizeLocale, suggestedLocaleForCountry } from "./locales.js";

test("premium Telegram start copy exists for all 16 languages", () => {
  const freeMarkers = {
    ru: "ПОЛНОСТЬЮ БЕСПЛАТНЫЙ", en: "COMPLETELY FREE", de: "VOLLSTÄNDIG KOSTENLOS",
    fr: "ENTIÈREMENT GRATUIT", it: "COMPLETAMENTE GRATUITO", es: "COMPLETAMENTE GRATUITO",
    pt: "TOTALMENTE GRATUITO", ja: "完全無料", hi: "पूरी तरह निःशुल्क", id: "SEPENUHNYA GRATIS",
    ko: "완전 무료", tr: "TAMAMEN ÜCRETSİZDİR", uk: "ПОВНІСТЮ БЕЗКОШТОВНИЙ",
    sv: "HELT KOSTNADSFRI", no: "HELT GRATIS", zh: "完全免费"
  };
  assert.equal(LOCALES.length, 16);
  for (const [locale] of LOCALES) {
    const copy = getBotCopy(locale);
    assert.match(copy.open, /AI SIGNAL/);
    assert.ok(copy.start.split("\n").filter(Boolean).length >= 16, locale);
    assert.ok(copy.start.includes(freeMarkers[locale]), `${locale}: free access marker`);
    assert.match(copy.start, /NO SIGNAL/, `${locale}: signal fallback`);
    assert.match(copy.start, /(?:\$5|5 \$|5ドル|5 美元)/, `${locale}: minimum deposit`);
    assert.ok(copy.start.length < 4096, `${locale}: Telegram message limit`);
    assert.equal((copy.start.match(/<b>/g) || []).length, (copy.start.match(/<\/b>/g) || []).length, `${locale}: balanced HTML`);
    assert.ok(copy.followup.length > 50, locale);
  }
});

test("locale aliases and conservative GEO suggestions work", () => {
  assert.equal(normalizeLocale("ua-UA"), "uk");
  assert.equal(normalizeLocale("cn"), "zh");
  assert.equal(suggestedLocaleForCountry("BR"), "pt");
  assert.equal(suggestedLocaleForCountry("NL"), null);
});
