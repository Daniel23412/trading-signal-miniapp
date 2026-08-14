import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import handler from "./bot.js";

function responseRecorder() {
  return {
    code: 200, body: null,
    status(value) { this.code = value; return this; },
    json(value) { this.body = value; return this; }
  };
}

function secret(token) {
  return crypto.createHash("sha256").update(`ai-signal-webhook:${token}`).digest("hex");
}

test("language selection replaces the chooser with one premium open button", async () => {
  const oldFetch = global.fetch;
  const oldEnv = { ...process.env };
  const token = "123:test-token";
  process.env.BOT_TOKEN = token;
  process.env.MINIAPP_URL = "https://example.vercel.app";
  delete process.env.DATABASE_URL;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ method: new URL(url).pathname.split("/").pop(), body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ ok: true, result: true }) };
  };
  try {
    const headers = { "x-telegram-bot-api-secret-token": secret(token) };
    const startRes = responseRecorder();
    await handler({ method: "POST", headers, body: { message: { chat: { id: 9 }, from: { id: 867371536, language_code: "en" }, text: "/start" } } }, startRes);
    assert.equal(startRes.code, 200);
    assert.equal(calls[0].method, "sendMessage");
    assert.equal(calls[0].body.reply_markup.inline_keyboard.length, 8);

    calls.length = 0;
    const callbackRes = responseRecorder();
    await handler({ method: "POST", headers, body: { callback_query: {
      id: "cb-1", data: "lang:en", from: { id: 867371536, language_code: "en" },
      message: { chat: { id: 9 }, message_id: 44 }
    } } }, callbackRes);
    const edit = calls.find(call => call.method === "editMessageText");
    assert.ok(edit);
    assert.match(edit.body.text, /chart analysis in seconds/i);
    assert.equal(edit.body.reply_markup.inline_keyboard.length, 1);
    assert.equal(edit.body.reply_markup.inline_keyboard[0].length, 1);
    assert.match(edit.body.reply_markup.inline_keyboard[0][0].text, /OPEN AI SIGNAL/);
    assert.match(edit.body.reply_markup.inline_keyboard[0][0].web_app.url, /lang=en/);
  } finally {
    global.fetch = oldFetch;
    process.env = oldEnv;
  }
});
