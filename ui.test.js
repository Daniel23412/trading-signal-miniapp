import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

test("every app ID selector exists exactly once in the document", () => {
  const selectors = [...app.matchAll(/\$\("#([A-Za-z][\w-]*)"\)/g)].map(match => match[1]);
  assert.ok(selectors.length > 35);
  for (const id of new Set(selectors)) {
    const count = [...html.matchAll(new RegExp(`id=["']${id}["']`, "g"))].length;
    assert.equal(count, 1, `#${id} should exist exactly once`);
  }
});

test("all 16 locales contain every base, access and enhancement key", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL("./i18n.js", import.meta.url), "utf8"), context);
  vm.runInContext(fs.readFileSync(new URL("./i18n-extra.js", import.meta.url), "utf8"), context);
  const locales = ["ru", "en", "de", "fr", "it", "es", "pt", "ja", "hi", "id", "ko", "tr", "uk", "sv", "no", "zh"];
  assert.deepEqual(Object.keys(context.window.AI_I18N).sort(), [...locales].sort());
  const allKeys = Object.keys(context.window.AI_I18N.en);
  for (const locale of locales) {
    for (const key of allKeys) assert.notEqual(context.window.AI_I18N[locale][key], undefined, `${locale}.${key}`);
  }

  const start = app.indexOf("const ACCESS_TEXT = ");
  const end = app.indexOf("\n    const $ =", start);
  assert.ok(start > 0 && end > start);
  const accessLiteral = app.slice(start + "const ACCESS_TEXT = ".length, end).trim().replace(/;$/, "");
  const accessContext = { result: null };
  vm.createContext(accessContext);
  vm.runInContext(`result = ${accessLiteral}`, accessContext);
  assert.deepEqual(Object.keys(accessContext.result).sort(), [...locales].sort());
  const accessKeys = Object.keys(accessContext.result.en);
  for (const locale of locales) {
    for (const key of accessKeys) assert.equal(typeof accessContext.result[locale][key], "string", `${locale}.access.${key}`);
  }
});

test("session history stores only signal metadata and no image", () => {
  const block = app.slice(app.indexOf("function addHistory"), app.indexOf("function renderHistory"));
  assert.match(block, /signal:\s*result\.signal/);
  assert.match(block, /timeframe:\s*meta\.timeframe/);
  assert.match(block, /expiration:\s*meta\.expiration_minutes/);
  assert.doesNotMatch(block, /image|preview|dataUrl/i);
  assert.match(block, /slice\(0,\s*3\)/);
  assert.doesNotMatch(app, /new MutationObserver/);
});

test("client scripts load in locale-before-app order", () => {
  const scripts = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(match => match[1].split("?")[0]);
  assert.deepEqual(scripts.slice(-6), [
    "/launch-locale.js", "/i18n.js", "/i18n-extra.js", "/app.js", "/ui-enhancements.js", "/trading-ambience.js"
  ]);
});

test("Vercel cron is daily and protected by the server route", () => {
  const config = JSON.parse(fs.readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.crons, [{ path: "/api/follow-up", schedule: "0 10 * * *" }]);
  const route = fs.readFileSync(new URL("./api/follow-up.js", import.meta.url), "utf8");
  assert.match(route, /CRON_SECRET/);
  assert.match(route, /authorization/);
});
